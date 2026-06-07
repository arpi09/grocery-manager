import {
	parseAnalyticsBehaviorPeriodDays,
	type AdminBehaviorFunnel,
	type AdminBehaviorHeatmap,
	type AdminBehaviorOverview,
	type AdminBehaviorRetention,
	type AdminEventExplorer,
	type AnalyticsBehaviorPeriodDays
} from '$lib/domain/analytics-behavior';
import type { IAnalyticsBehaviorRepository } from '$lib/infrastructure/repositories/analytics-behavior.repository';

export class AnalyticsAdminService {
	constructor(private readonly repository: IAnalyticsBehaviorRepository) {}

	getBehaviorOverview(periodDays: AnalyticsBehaviorPeriodDays): Promise<AdminBehaviorOverview> {
		return this.repository.getBehaviorOverview(periodDays);
	}

	getBehaviorHeatmap(
		route: string,
		periodDays: AnalyticsBehaviorPeriodDays
	): Promise<AdminBehaviorHeatmap> {
		return this.repository.getBehaviorHeatmap(route, periodDays);
	}

	getEventExplorer(
		periodDays: AnalyticsBehaviorPeriodDays,
		eventType?: string
	): Promise<AdminEventExplorer> {
		return this.repository.getEventExplorer(periodDays, eventType);
	}

	getBehaviorFunnel(periodDays: AnalyticsBehaviorPeriodDays): Promise<AdminBehaviorFunnel> {
		return this.repository.getBehaviorFunnel(periodDays);
	}

	getBehaviorRetention(periodDays: AnalyticsBehaviorPeriodDays): Promise<AdminBehaviorRetention> {
		return this.repository.getBehaviorRetention(periodDays);
	}

	parsePeriodDays(raw: string | null): AnalyticsBehaviorPeriodDays {
		return parseAnalyticsBehaviorPeriodDays(raw);
	}
}
