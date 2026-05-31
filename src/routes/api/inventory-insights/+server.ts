import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import {
	formatInventoryLines,
	formatPlannedMealLines,
	formatRecipeIdeaLines,
	upcomingDateRange
} from '$lib/server/inventory-context';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { requestStructuredJson, translateOpenAiError } from '$lib/server/openai';
import type { RequestHandler } from './$types';

const INSIGHT_TYPES = [
	'expiring',
	'running_low',
	'use_soon',
	'restock',
	'meal_plan',
	'tip'
] as const;

type InsightType = (typeof INSIGHT_TYPES)[number];

interface InventoryInsight {
	type: InsightType;
	title: string;
	detail: string;
	priority: 'high' | 'medium' | 'low';
	relatedItems: string[];
}

function parseInsightType(value: unknown): InsightType {
	if (typeof value === 'string' && INSIGHT_TYPES.includes(value as InsightType)) {
		return value as InsightType;
	}
	return 'tip';
}

function parseInsights(input: unknown): InventoryInsight[] {
	if (!input || typeof input !== 'object') {
		return [];
	}

	const insights = (input as { insights?: unknown }).insights;
	if (!Array.isArray(insights)) {
		return [];
	}

	return insights
		.map((row) => {
			if (!row || typeof row !== 'object') {
				return null;
			}
			const candidate = row as Record<string, unknown>;
			const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
			const detail = typeof candidate.detail === 'string' ? candidate.detail.trim() : '';
			const priority =
				candidate.priority === 'high' || candidate.priority === 'low'
					? candidate.priority
					: 'medium';
			const relatedItems = Array.isArray(candidate.relatedItems)
				? candidate.relatedItems
						.filter((v): v is string => typeof v === 'string')
						.map((v) => v.trim())
						.filter(Boolean)
						.slice(0, 8)
				: [];

			if (!title || !detail) {
				return null;
			}

			return {
				type: parseInsightType(candidate.type),
				title,
				detail,
				priority,
				relatedItems
			};
		})
		.filter((insight): insight is InventoryInsight => insight !== null)
		.slice(0, 8);
}

function parseSummary(input: unknown): string {
	if (!input || typeof input !== 'object') {
		return '';
	}
	const summary = (input as { summary?: unknown }).summary;
	return typeof summary === 'string' ? summary.trim() : '';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'inventory insights');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const body = (await request.json().catch(() => ({}))) as { focus?: unknown };
	const focus = typeof body.focus === 'string' ? body.focus.trim().slice(0, 300) : '';

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			summary: translate(locals.locale, 'errors.api.insightsEmpty'),
			insights: [],
			note: translate(locals.locale, 'errors.api.insightsAddItems')
		});
	}

	const { fromDate, toDate } = upcomingDateRange(14);
	const [plannedMeals, recipeIdeas] = await Promise.all([
		locals.mealPlanService.listPlannedMealsByRange(auth.user.id, fromDate, toDate),
		locals.mealPlanService.listRecipeIdeas(auth.user.id, 6)
	]);

	const userPrompt = [
		'Current inventory:',
		formatInventoryLines(inventory),
		'',
		`Planned meals (${fromDate} to ${toDate}):`,
		formatPlannedMealLines(plannedMeals),
		'',
		'Saved recipe ideas:',
		formatRecipeIdeaLines(recipeIdeas),
		focus ? `\nUser focus: ${focus}` : ''
	].join('\n');

	const systemPrompt = [
		'You are a practical Swedish home pantry assistant.',
		'Analyze inventory, expiry dates, quantities, planned meals, and recipe ideas.',
		'Respond in Swedish (sv-SE).',
		'Give actionable insights: what to use soon, what may be running low, restock suggestions, and how meals align with stock.',
		'Be realistic — infer "running low" from small quantities or missing staples, not only exact counts.',
		'Return JSON only:',
		'{"summary":"","insights":[{"type":"expiring|running_low|use_soon|restock|meal_plan|tip","title":"","detail":"","priority":"high|medium|low","relatedItems":[]}]}',
		'Rules:',
		'- summary: 1-2 short sentences',
		'- up to 8 insights, most important first',
		'- relatedItems: inventory item names mentioned (can be empty)',
		'- no markdown code fences'
	].join('\n');

	const result = await requestStructuredJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'inventory_insights',
		schema: {
			type: 'object',
			properties: {
				summary: { type: 'string' },
				insights: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							type: { type: 'string', enum: [...INSIGHT_TYPES] },
							title: { type: 'string' },
							detail: { type: 'string' },
							priority: { type: 'string', enum: ['high', 'medium', 'low'] },
							relatedItems: {
								type: 'array',
								items: { type: 'string' }
							}
						},
						required: ['type', 'title', 'detail', 'priority', 'relatedItems'],
						additionalProperties: false
					}
				}
			},
			required: ['summary', 'insights'],
			additionalProperties: false
		}
	});

	if (!result.ok) {
		return json({ error: translateOpenAiError(locals.locale, result) }, { status: result.status });
	}

	const summary = parseSummary(result.data);
	const insights = parseInsights(result.data);

	if (!summary && insights.length === 0) {
		return json(
			{ error: translate(locals.locale, 'errors.api.insightsParse') },
			{ status: 502 }
		);
	}

	return json({
		summary: summary || translate(locals.locale, 'errors.api.insightsSummary'),
		insights
	});
};
