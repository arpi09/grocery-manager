import {
	buildSkaffurapportSnapshot,
	parseReportMonth,
	skaffurapportSettingsKey,
	type SkaffurapportSnapshot
} from '$lib/domain/skaffurapport';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';

export class SkaffurapportService {
	constructor(
		private readonly consumptionRepository: IConsumptionRepository,
		private readonly appSettings: IAppSettingsRepository
	) {}

	async aggregateMonth(month: string, generatedAt = new Date()): Promise<SkaffurapportSnapshot | null> {
		const range = parseReportMonth(month);
		if (!range) {
			return null;
		}

		const events = await this.consumptionRepository.listWasteEventsBetween(range.start, range.end);
		const snapshot = buildSkaffurapportSnapshot(month, events, generatedAt);
		await this.appSettings.setJson(skaffurapportSettingsKey(month), snapshot);
		return snapshot;
	}

	async getPublishedReport(month: string): Promise<SkaffurapportSnapshot | null> {
		return this.appSettings.getJson<SkaffurapportSnapshot>(skaffurapportSettingsKey(month));
	}

	async getOrAggregateReport(month: string): Promise<SkaffurapportSnapshot | null> {
		const cached = await this.getPublishedReport(month);
		if (cached) {
			return cached;
		}
		return this.aggregateMonth(month);
	}
}
