export const ANALYTICS_BEHAVIOR_PERIOD_DAYS = [7, 30] as const;
export type AnalyticsBehaviorPeriodDays = (typeof ANALYTICS_BEHAVIOR_PERIOD_DAYS)[number];

export const ANALYTICS_INTERACTION_KINDS = ['click', 'scroll_depth'] as const;
export type AnalyticsInteractionKind = (typeof ANALYTICS_INTERACTION_KINDS)[number];

export const ANALYTICS_RAW_RETENTION_DAYS = 90;
export const ANALYTICS_SESSION_IDLE_MS = 30 * 60 * 1000;

const ROUTE_NORMALIZATION_RULES: Array<{ pattern: RegExp; normalized: string }> = [
	{ pattern: /^\/inventory\/[^/]+$/, normalized: '/inventory/:location' },
	{ pattern: /^\/inventory\/[^/]+\/item\/new$/, normalized: '/inventory/:location/item/new' },
	{ pattern: /^\/item\/[^/]+\/edit$/, normalized: '/item/:id/edit' },
	{ pattern: /^\/recept\/[^/]+\/laga$/, normalized: '/recept/:id/laga' },
	{ pattern: /^\/recept\/[^/]+$/, normalized: '/recept/:id' },
	{ pattern: /^\/dela\/[^/]+$/, normalized: '/dela/:token' },
	{ pattern: /^\/invite\/[^/]+$/, normalized: '/invite/:token' },
	{ pattern: /^\/reset-password\/[^/]+$/, normalized: '/reset-password/:token' },
	{ pattern: /^\/verify-email\/[^/]+$/, normalized: '/verify-email/:token' },
	{ pattern: /^\/rapport\/[^/]+$/, normalized: '/rapport/:month' }
];

/** Normalizes SvelteKit paths for aggregated analytics (no PII segments). */
export function normalizeAnalyticsRoute(pathname: string): string {
	const raw = pathname.split('?')[0]?.split('#')[0]?.trim() || '/';
	if (raw === '/') {
		return '/';
	}

	const path = raw.startsWith('/') ? raw : `/${raw}`;
	for (const rule of ROUTE_NORMALIZATION_RULES) {
		if (rule.pattern.test(path)) {
			return rule.normalized;
		}
	}
	return path;
}

export function parseAnalyticsBehaviorPeriodDays(
	raw: string | null,
	defaultValue: AnalyticsBehaviorPeriodDays = 7
): AnalyticsBehaviorPeriodDays {
	const parsed = Number(raw ?? defaultValue);
	if (parsed === 30) {
		return 30;
	}
	return 7;
}

export function isAnalyticsInteractionKind(value: unknown): value is AnalyticsInteractionKind {
	return typeof value === 'string' && (ANALYTICS_INTERACTION_KINDS as readonly string[]).includes(value);
}

export interface BehaviorRouteOverviewRow {
	route: string;
	viewCount: number;
	uniqueSessions: number;
	avgDurationMs: number;
}

export interface BehaviorHeatmapRow {
	elementKey: string;
	clickCount: number;
}

export interface BehaviorEventExplorerRow {
	day: string;
	eventType: string;
	count: number;
}

export interface BehaviorFunnelStep {
	step: string;
	count: number;
}

export interface BehaviorRetentionPoint {
	dayOffset: number;
	rate: number;
	eligible: number;
	retained: number;
}

export interface AdminBehaviorOverview {
	periodDays: AnalyticsBehaviorPeriodDays;
	periodStart: Date;
	periodEnd: Date;
	routes: BehaviorRouteOverviewRow[];
}

export interface AdminBehaviorHeatmap {
	route: string;
	periodDays: AnalyticsBehaviorPeriodDays;
	elements: BehaviorHeatmapRow[];
}

export interface AdminEventExplorer {
	periodDays: AnalyticsBehaviorPeriodDays;
	events: BehaviorEventExplorerRow[];
}

export interface AdminBehaviorFunnel {
	periodDays: AnalyticsBehaviorPeriodDays;
	steps: BehaviorFunnelStep[];
}

export interface AdminBehaviorRetention {
	periodDays: AnalyticsBehaviorPeriodDays;
	points: BehaviorRetentionPoint[];
}
