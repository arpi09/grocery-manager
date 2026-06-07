import type { BehaviorEventExplorerRow, BehaviorFunnelStep } from '$lib/domain/analytics-behavior';
import { mondayWeekStartUtc } from '$lib/domain/cohort-retention';

export const DECISIONS_HEATMAP_ROUTES = [
	'/inventory/:location',
	'/planer/vecka',
	'/recept/:id',
	'/recept/:id/laga'
] as const;

export const ADMIN_INSIGHT_CHART_KEYS = {
	funnel: 'funnel',
	retention: 'retention',
	cohort: 'cohort',
	events: 'events',
	heatmap: 'heatmap'
} as const;

export interface TopEventRow {
	eventType: string;
	count: number;
}

export interface WeeklyEventRow {
	weekStart: string;
	eventType: string;
	count: number;
}

export interface FunnelConversionRow {
	step: string;
	count: number;
	conversionFromPrevious: number | null;
}

export function buildTopEvents(
	events: BehaviorEventExplorerRow[],
	limit = 5
): TopEventRow[] {
	const totals = new Map<string, number>();
	for (const row of events) {
		totals.set(row.eventType, (totals.get(row.eventType) ?? 0) + row.count);
	}
	return [...totals.entries()]
		.map(([eventType, count]) => ({ eventType, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

export function buildWeeklyEventTotals(events: BehaviorEventExplorerRow[]): WeeklyEventRow[] {
	const totals = new Map<string, number>();
	for (const row of events) {
		const weekStart = mondayWeekStartUtc(new Date(`${row.day}T12:00:00.000Z`));
		const key = `${weekStart}\0${row.eventType}`;
		totals.set(key, (totals.get(key) ?? 0) + row.count);
	}

	return [...totals.entries()]
		.map(([key, count]) => {
			const [weekStart, eventType] = key.split('\0');
			return { weekStart, eventType, count };
		})
		.sort((a, b) => b.weekStart.localeCompare(a.weekStart) || b.count - a.count);
}

export function buildFunnelConversions(steps: BehaviorFunnelStep[]): FunnelConversionRow[] {
	return steps.map((step, index) => {
		const previous = index > 0 ? steps[index - 1] : null;
		const conversionFromPrevious =
			previous && previous.count > 0 ? step.count / previous.count : null;
		return {
			step: step.step,
			count: step.count,
			conversionFromPrevious
		};
	});
}

export function formatRate(rate: number | null): string {
	if (rate === null) {
		return '—';
	}
	return `${Math.round(rate * 100)}%`;
}
