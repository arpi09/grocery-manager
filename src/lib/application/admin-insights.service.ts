import type { PmfWeeklyReview } from '$lib/domain/pmf';
import type {
	AdminBehaviorOverview,
	AdminBehaviorFunnel,
	AdminEventExplorer
} from '$lib/domain/analytics-behavior';
import { ADMIN_INSIGHT_CHART_KEYS } from '$lib/domain/decisions-analytics';
import type { PmfFunnelSnapshot } from '$lib/domain/pmf-funnel';
import type { ProductFeedbackEntry } from '$lib/domain/product-feedback';
import type { AiRateLimitService } from '$lib/application/ai-rate-limit.service';
import type { AnalyticsAdminService } from '$lib/application/analytics-admin.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { ProductFeedbackService } from '$lib/application/product-feedback.service';
import {
	extractResponseOutputText,
	getOpenAiApiKey,
	OPENAI_MODEL,
	safeParseModelJson
} from '$lib/server/openai';

export interface AdminInsightsInput {
	pmfWeeklyReview: PmfWeeklyReview;
	pmfFunnel: PmfFunnelSnapshot;
	behaviorOverview: AdminBehaviorOverview;
	behaviorFunnel: AdminBehaviorFunnel;
	eventExplorer: AdminEventExplorer;
	recentFeedback: ProductFeedbackEntry[];
}

export interface AdminInsightsResult {
	summaryParagraphs: string[];
	anomalyFlags: string[];
	chartCaptions: Record<string, string>;
	generatedAt: Date;
	cached: boolean;
}

const INSIGHTS_CACHE_TTL_MS = 60 * 60 * 1000;

const insightsSchema = {
	type: 'object',
	properties: {
		summaryParagraphs: {
			type: 'array',
			items: { type: 'string' },
			minItems: 3,
			maxItems: 5
		},
		anomalyFlags: {
			type: 'array',
			items: { type: 'string' }
		},
		chartCaptions: {
			type: 'object',
			additionalProperties: { type: 'string' }
		}
	},
	required: ['summaryParagraphs', 'anomalyFlags', 'chartCaptions'],
	additionalProperties: false
} as const;

export class AdminInsightsService {
	private cache: { expiresAt: number; result: AdminInsightsResult } | null = null;

	constructor(
		private readonly pmfService: PmfService,
		private readonly analyticsAdminService: AnalyticsAdminService,
		private readonly productFeedbackService: ProductFeedbackService,
		private readonly aiRateLimitService: AiRateLimitService
	) {}

	async getInsights(options: {
		adminUserId: string;
		forceRefresh?: boolean;
	}): Promise<AdminInsightsResult | { error: string }> {
		const now = Date.now();
		if (!options.forceRefresh && this.cache && this.cache.expiresAt > now) {
			return { ...this.cache.result, cached: true };
		}

		const quota = await this.aiRateLimitService.tryConsume({
			householdId: null,
			userId: options.adminUserId,
			kind: 'admin_insights',
			tier: 'free'
		});
		if (!quota.allowed) {
			return { error: 'rate_limited' };
		}

		const apiKey = getOpenAiApiKey();
		if (!apiKey) {
			return { error: 'openai_not_configured' };
		}

		const [pmfWeeklyReview, pmfFunnel, behaviorOverview, behaviorFunnel, eventExplorer, recentFeedback] =
			await Promise.all([
				this.pmfService.getWeeklyReview(),
				this.pmfService.getFunnelMetrics(7),
				this.analyticsAdminService.getBehaviorOverview(7),
				this.analyticsAdminService.getBehaviorFunnel(7),
				this.analyticsAdminService.getEventExplorer(7),
				this.productFeedbackService.listRecent(5)
			]);

		const input: AdminInsightsInput = {
			pmfWeeklyReview,
			pmfFunnel,
			behaviorOverview,
			behaviorFunnel,
			eventExplorer,
			recentFeedback
		};

		const generated = await this.requestInsights(apiKey, input);
		if ('error' in generated) {
			return generated;
		}

		const result: AdminInsightsResult = {
			...generated,
			generatedAt: new Date(),
			cached: false
		};
		this.cache = { expiresAt: now + INSIGHTS_CACHE_TTL_MS, result };
		return result;
	}

	async getWeeklyDigestParagraph(): Promise<string | null> {
		const apiKey = getOpenAiApiKey();
		if (!apiKey) {
			return null;
		}

		const [pmfWeeklyReview, behaviorOverview] = await Promise.all([
			this.pmfService.getWeeklyReview(),
			this.analyticsAdminService.getBehaviorOverview(7)
		]);

		const payload = {
			onTarget: `${pmfWeeklyReview.onTargetCount}/${pmfWeeklyReview.totalTracked}`,
			topRoutes: behaviorOverview.routes.slice(0, 5),
			belowTarget: pmfWeeklyReview.belowTarget.map((m) => m.key)
		};

		try {
			const response = await fetch('https://api.openai.com/v1/responses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: OPENAI_MODEL,
					input: [
						{
							role: 'system',
							content:
								'Skriv en kort svensk veckosammanfattning (1 stycke, max 80 ord) för Skaffus ägare baserat på aggregerad PMF- och beteendedata. Ton: rak, ägar-fokus. Inga personuppgifter.'
						},
						{
							role: 'user',
							content: JSON.stringify(payload)
						}
					]
				})
			});
			if (!response.ok) {
				return null;
			}
			const body = (await response.json()) as unknown;
			const text = extractResponseOutputText(body).trim();
			return text || null;
		} catch {
			return null;
		}
	}

	private async requestInsights(
		apiKey: string,
		input: AdminInsightsInput
	): Promise<Omit<AdminInsightsResult, 'generatedAt' | 'cached'> | { error: string }> {
		const sanitized = {
			pmf: {
				onTarget: `${input.pmfWeeklyReview.onTargetCount}/${input.pmfWeeklyReview.totalTracked}`,
				belowTarget: input.pmfWeeklyReview.belowTarget.map((m) => ({
					key: m.key,
					current: m.current,
					deltaDirection: m.deltaDirection
				}))
			},
			funnel: input.pmfFunnel,
			topRoutes: input.behaviorOverview.routes.slice(0, 10),
			behaviorFunnel: input.behaviorFunnel.steps,
			recentEvents: input.eventExplorer.events.slice(0, 20),
			feedbackSnippets: input.recentFeedback.map((row) => row.message?.slice(0, 200)).filter(Boolean)
		};

		try {
			const response = await fetch('https://api.openai.com/v1/responses', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: OPENAI_MODEL,
					input: [
						{
							role: 'system',
							content:
								'Du är produktanalytiker för Skaffu (svensk skafferi-app). Svara på svenska med JSON enligt schema. Ingen rå användardata — bara aggregerade metrics. chartCaptions MÅSTE innehålla exakt dessa nycklar med en kort mening vardera: funnel, retention, events, heatmap (valfritt cohort om kohortdata finns).'
						},
						{
							role: 'user',
							content: JSON.stringify(sanitized)
						}
					],
					text: {
						format: {
							type: 'json_schema',
							name: 'admin_insights',
							strict: true,
							schema: insightsSchema
						}
					}
				})
			});

			if (!response.ok) {
				return { error: 'openai_failed' };
			}

			const payload = (await response.json()) as unknown;
			const raw = extractResponseOutputText(payload);
			const parsed = safeParseModelJson(raw) as {
				summaryParagraphs?: unknown;
				anomalyFlags?: unknown;
				chartCaptions?: unknown;
			} | null;

			if (!parsed || !Array.isArray(parsed.summaryParagraphs)) {
				return { error: 'openai_invalid' };
			}

			const chartCaptions =
				parsed.chartCaptions && typeof parsed.chartCaptions === 'object'
					? (parsed.chartCaptions as Record<string, string>)
					: {};

			return {
				summaryParagraphs: parsed.summaryParagraphs.filter(
					(entry): entry is string => typeof entry === 'string'
				),
				anomalyFlags: Array.isArray(parsed.anomalyFlags)
					? parsed.anomalyFlags.filter((entry): entry is string => typeof entry === 'string')
					: [],
				chartCaptions: {
					[ADMIN_INSIGHT_CHART_KEYS.funnel]: chartCaptions.funnel ?? '',
					[ADMIN_INSIGHT_CHART_KEYS.retention]: chartCaptions.retention ?? '',
					[ADMIN_INSIGHT_CHART_KEYS.events]: chartCaptions.events ?? '',
					[ADMIN_INSIGHT_CHART_KEYS.heatmap]: chartCaptions.heatmap ?? '',
					[ADMIN_INSIGHT_CHART_KEYS.cohort]: chartCaptions.cohort ?? ''
				}
			};
		} catch {
			return { error: 'openai_network' };
		}
	}
}
