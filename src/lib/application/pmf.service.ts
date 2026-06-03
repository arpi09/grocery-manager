import type {
	IPmfRepository,
	RecordProductEventInput
} from '$lib/infrastructure/repositories/pmf.repository';
import { buildWeeklyReview, type PmfMetricSnapshot, type PmfWeeklyReview } from '$lib/domain/pmf';
import {
	parsePmfFunnelPeriodDays,
	type PmfFunnelPeriodDays,
	type PmfFunnelSnapshot
} from '$lib/domain/pmf-funnel';

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
}
