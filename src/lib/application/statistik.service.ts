import type { InventoryAnalytics, InventoryService } from '$lib/application/inventory.service';
import {
	buildLastNWeekBars,
	computeWeekOverWeek,
	computeZeroWasteStreak,
	startOfWeek,
	type WeeklyBar
} from '$lib/domain/statistik';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';

const TREND_WEEKS = 4;

export interface ImpactStats {
	hasConsumptionData: boolean;
	consumedThisWeek: number | null;
	consumedWeekOverWeek: ReturnType<typeof computeWeekOverWeek>;
	consumedTrend: WeeklyBar[];
	wasteTrend: WeeklyBar[];
	zeroWasteWeeks: number | null;
}

export interface StatistikDashboard {
	analytics: InventoryAnalytics;
	addedTrend: WeeklyBar[];
	addedWeekOverWeek: ReturnType<typeof computeWeekOverWeek>;
	impact: ImpactStats;
}

export class StatistikService {
	constructor(
		private readonly inventoryService: InventoryService,
		private readonly inventoryRepository: IInventoryRepository,
		private readonly consumptionRepository: IConsumptionRepository
	) {}

	/** Lighter than getDashboard — used by /hem engagement strip. */
	async getImpact(householdId: string): Promise<ImpactStats> {
		const referenceDate = new Date();
		const [consumedCounts, wasteCounts] = await Promise.all([
			this.consumptionRepository.weeklyCountsByEventType(
				householdId,
				['consumed'],
				TREND_WEEKS,
				referenceDate
			),
			this.consumptionRepository.weeklyCountsByEventType(
				householdId,
				['discarded', 'expired'],
				TREND_WEEKS,
				referenceDate
			)
		]);
		return this.buildImpactStats(householdId, consumedCounts, wasteCounts, referenceDate);
	}

	async getDashboard(householdId: string): Promise<StatistikDashboard> {
		const referenceDate = new Date();
		const [analytics, addedCounts, consumedCounts, wasteCounts] = await Promise.all([
			this.inventoryService.getAnalytics(householdId),
			this.inventoryRepository.weeklyAddedCounts(householdId, TREND_WEEKS, referenceDate),
			this.consumptionRepository.weeklyCountsByEventType(
				householdId,
				['consumed'],
				TREND_WEEKS,
				referenceDate
			),
			this.consumptionRepository.weeklyCountsByEventType(
				householdId,
				['discarded', 'expired'],
				TREND_WEEKS,
				referenceDate
			)
		]);

		const addedTrend = buildLastNWeekBars(addedCounts, TREND_WEEKS, referenceDate);
		const impact = await this.buildImpactStats(
			householdId,
			consumedCounts,
			wasteCounts,
			referenceDate
		);

		return {
			analytics,
			addedTrend,
			addedWeekOverWeek: computeWeekOverWeek(addedTrend),
			impact
		};
	}

	private async buildImpactStats(
		householdId: string,
		consumedCounts: Awaited<
			ReturnType<IConsumptionRepository['weeklyCountsByEventType']>
		>,
		wasteCounts: Awaited<ReturnType<IConsumptionRepository['weeklyCountsByEventType']>>,
		referenceDate: Date
	): Promise<ImpactStats> {
		const consumedTrend = buildLastNWeekBars(consumedCounts, TREND_WEEKS, referenceDate);
		const wasteTrend = buildLastNWeekBars(wasteCounts, TREND_WEEKS, referenceDate);
		const hasConsumptionData = consumedCounts.some((entry) => entry.count > 0);
		const currentWeekStart = startOfWeek(referenceDate);

		const consumedThisWeek = hasConsumptionData
			? await this.consumptionRepository.countByEventTypeSince(
					householdId,
					['consumed'],
					currentWeekStart
				)
			: null;

		return {
			hasConsumptionData,
			consumedThisWeek,
			consumedWeekOverWeek: hasConsumptionData ? computeWeekOverWeek(consumedTrend) : null,
			consumedTrend,
			wasteTrend,
			zeroWasteWeeks: hasConsumptionData ? computeZeroWasteStreak(wasteTrend) : null
		};
	}
}
