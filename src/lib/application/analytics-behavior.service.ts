import { ANALYTICS_RAW_RETENTION_DAYS } from '$lib/domain/analytics-behavior';
import type {
	IngestBeaconContext,
	IngestBeaconInput,
	IAnalyticsBehaviorRepository
} from '$lib/infrastructure/repositories/analytics-behavior.repository';

export class AnalyticsBehaviorService {
	constructor(private readonly repository: IAnalyticsBehaviorRepository) {}

	ingestBeacon(context: IngestBeaconContext, input: IngestBeaconInput): Promise<void> {
		return this.repository.ingestBeacon(context, input);
	}

	async runRollup(now = new Date()): Promise<{
		routeRows: number;
		elementRows: number;
		deletedSessions: number;
	}> {
		const yesterday = new Date(now);
		yesterday.setUTCDate(yesterday.getUTCDate() - 1);
		yesterday.setUTCHours(0, 0, 0, 0);

		const rollup = await this.repository.rollupDaily(yesterday);
		const cutoff = new Date(now);
		cutoff.setUTCDate(cutoff.getUTCDate() - ANALYTICS_RAW_RETENTION_DAYS);
		const deletedSessions = await this.repository.deleteRawOlderThan(cutoff);

		return { ...rollup, deletedSessions };
	}
}

export type {
	IngestBeaconContext,
	IngestBeaconInput,
	IAnalyticsBehaviorRepository
} from '$lib/infrastructure/repositories/analytics-behavior.repository';
