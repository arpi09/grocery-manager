import type {
	IPmfRepository,
	RecordProductEventInput
} from '$lib/infrastructure/repositories/pmf.repository';
import { buildWeeklyReview, type PmfMetricSnapshot, type PmfWeeklyReview } from '$lib/domain/pmf';
import type { LaunchCohortSnapshot } from '$lib/domain/launch-cohort';
import {
	parsePmfFunnelPeriodDays,
	type PmfFunnelPeriodDays,
	type PmfFunnelSnapshot
} from '$lib/domain/pmf-funnel';
import type { HouseholdActivityEvent } from '$lib/domain/household-activity';
import {
	buildSyncFunnelSnapshot,
	type SyncFunnelSnapshot
} from '$lib/domain/sync-funnel-admin';
import type { AcquisitionMetricsSnapshot } from '$lib/domain/acquisition-metrics';
import type { MarketV01MetricsSnapshot } from '$lib/domain/market-v01-metrics';
import {
	buildBrainMetricsSnapshot,
	parseBrainMetricsPeriodDays,
	type BrainMetricsPeriodDays,
	type BrainMetricsSnapshot
} from '$lib/domain/brain-metrics-admin';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export class PmfService {
	constructor(private readonly repository: IPmfRepository) {}

	recordEvent(input: RecordProductEventInput): Promise<void> {
		return this.repository.recordEvent(input);
	}

	countUserScanEvents(userId: string): Promise<number> {
		return this.repository.countUserScanEvents(userId);
	}

	getUserCreatedAt(userId: string): Promise<Date | null> {
		return this.repository.getUserCreatedAt(userId);
	}

	getGlobalMetrics(now?: Date): Promise<PmfMetricSnapshot> {
		return this.repository.getGlobalMetrics(now);
	}

	getFunnelMetrics(
		periodDays: PmfFunnelPeriodDays = 7,
		now?: Date
	): Promise<PmfFunnelSnapshot> {
		return this.repository.getFunnelMetrics(periodDays, now);
	}

	getLaunchCohortSignups(
		periodDays: PmfFunnelPeriodDays,
		now?: Date
	): Promise<LaunchCohortSnapshot> {
		return this.repository.getLaunchCohortSignups(periodDays, now);
	}

	parseFunnelPeriodDays(raw: string | number | null | undefined): PmfFunnelPeriodDays {
		return parsePmfFunnelPeriodDays(raw);
	}

	async getWeeklyReview(now = new Date()): Promise<PmfWeeklyReview> {
		const previousWeekEnd = new Date(now.getTime() - WEEK_MS);
		const [current, previous] = await Promise.all([
			this.repository.getGlobalMetrics(now),
			this.repository.getGlobalMetrics(previousWeekEnd)
		]);

		return buildWeeklyReview(current, previous, now, previousWeekEnd);
	}

	listRecentHouseholdSyncEvents(
		householdId: string,
		limit = 8
	): Promise<HouseholdActivityEvent[]> {
		return this.repository.listRecentHouseholdSyncEvents(householdId, limit);
	}

	async getSyncFunnelSnapshot(now = new Date()): Promise<SyncFunnelSnapshot> {
		const counts = await this.repository.getSyncFunnelCounts(now);
		return buildSyncFunnelSnapshot(counts);
	}

	getAcquisitionMetrics(now = new Date()): Promise<AcquisitionMetricsSnapshot> {
		return this.repository.getAcquisitionMetrics(now);
	}

	getMarketV01Metrics(now = new Date()): Promise<MarketV01MetricsSnapshot> {
		return this.repository.getMarketV01Metrics(now);
	}

	async getBrainMetrics(
		periodDays: BrainMetricsPeriodDays = 7,
		now = new Date()
	): Promise<BrainMetricsSnapshot> {
		const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
		const raw = await this.repository.getBrainMetricsSince(since, now);
		return buildBrainMetricsSnapshot(raw, periodDays);
	}

	parseBrainMetricsPeriodDays(raw: string | number | null | undefined): BrainMetricsPeriodDays {
		return parseBrainMetricsPeriodDays(raw);
	}
}
