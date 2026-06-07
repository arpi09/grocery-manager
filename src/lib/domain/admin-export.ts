import {
	parseAnalyticsBehaviorPeriodDays,
	type AnalyticsBehaviorPeriodDays,
	type BehaviorEventExplorerRow,
	type BehaviorRouteOverviewRow
} from '$lib/domain/analytics-behavior';
import type { PmfWeeklyReview } from '$lib/domain/pmf';

export function parseAdminExportPeriodDays(
	raw: string | null,
	defaultValue: AnalyticsBehaviorPeriodDays = 30
): AnalyticsBehaviorPeriodDays {
	return parseAnalyticsBehaviorPeriodDays(raw, defaultValue);
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
	if (value === null || value === undefined) {
		return '';
	}

	const text = String(value);
	if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
		return `"${text.replaceAll('"', '""')}"`;
	}

	return text;
}

function formatCsvRow(cells: Array<string | number | boolean | null | undefined>): string {
	return cells.map(escapeCsvCell).join(',');
}

export interface AdminDataExportInput {
	exportedAt: Date;
	periodDays: AnalyticsBehaviorPeriodDays;
	pmfWeeklyReview: PmfWeeklyReview;
	events: BehaviorEventExplorerRow[];
	routes: BehaviorRouteOverviewRow[];
}

export function buildAdminDataExportCsv(input: AdminDataExportInput): string {
	const sections: string[] = [];
	const { exportedAt, periodDays, pmfWeeklyReview, events, routes } = input;

	sections.push(
		formatCsvRow(['section', 'pmf_snapshot']),
		formatCsvRow(['exported_at', 'period_days', 'current_week_end', 'previous_week_end']),
		formatCsvRow([
			exportedAt.toISOString(),
			periodDays,
			pmfWeeklyReview.currentWeekEnd.toISOString(),
			pmfWeeklyReview.previousWeekEnd.toISOString()
		]),
		'',
		formatCsvRow([
			'metric_key',
			'current',
			'previous',
			'target',
			'on_target',
			'delta',
			'delta_direction'
		]),
		...pmfWeeklyReview.metrics.map((metric) =>
			formatCsvRow([
				metric.key,
				metric.current,
				metric.previous,
				metric.target,
				metric.onTarget,
				metric.delta,
				metric.deltaDirection
			])
		),
		'',
		formatCsvRow(['supporting_metric', 'value']),
		formatCsvRow(['eligible_users', pmfWeeklyReview.current.eligibleUsers]),
		formatCsvRow(['activated_users', pmfWeeklyReview.current.activatedUsers]),
		formatCsvRow(['wau_count', pmfWeeklyReview.current.wauCount]),
		formatCsvRow(['weekly_scanners', pmfWeeklyReview.current.weeklyScanners]),
		formatCsvRow(['d7_eligible_users', pmfWeeklyReview.current.d7EligibleUsers]),
		formatCsvRow(['d30_eligible_users', pmfWeeklyReview.current.d30EligibleUsers]),
		formatCsvRow(['active_households', pmfWeeklyReview.current.activeHouseholds]),
		formatCsvRow([
			'multi_member_active_households',
			pmfWeeklyReview.current.multiMemberActiveHouseholds
		]),
		formatCsvRow(['weekly_fill_users', pmfWeeklyReview.current.weeklyFillUsers]),
		'',
		formatCsvRow(['section', 'events_per_day']),
		formatCsvRow(['day', 'event_type', 'count']),
		...events.map((event) => formatCsvRow([event.day, event.eventType, event.count])),
		'',
		formatCsvRow(['section', 'top_routes']),
		formatCsvRow(['route', 'view_count', 'unique_sessions', 'avg_duration_ms']),
		...routes.map((route) =>
			formatCsvRow([route.route, route.viewCount, route.uniqueSessions, route.avgDurationMs])
		)
	);

	return `${sections.join('\n')}\n`;
}

export function buildAdminExportFilename(periodDays: AnalyticsBehaviorPeriodDays, exportedAt = new Date()): string {
	return `skaffu-admin-export-${exportedAt.toISOString().slice(0, 10)}-${periodDays}d.csv`;
}
