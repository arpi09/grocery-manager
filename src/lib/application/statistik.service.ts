import type { InventoryAnalytics, InventoryService } from '$lib/application/inventory.service';
import {
	buildHouseholdInsights,
	type HouseholdInsight
} from '$lib/domain/household-insights';
import {
	buildLastNWeekBars,
	capZeroWasteStreak,
	computeWeekOverWeek,
	computeZeroWasteStreak,
	startOfWeek,
	weeksSinceHouseholdCreated,
	type WeeklyBar
} from '$lib/domain/statistik';
import {
	buildReceiptSpendReport,
	type ReceiptSpendReport
} from '$lib/domain/receipt-spend';
import { buildSavingsReport, type SavingsReport } from '$lib/domain/savings-estimate';
import { getWeekDateRange } from '$lib/domain/weekly-ritual';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import type { IPriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';

const SPEND_LOOKBACK_DAYS = 90;
const INSIGHT_LOOKBACK_DAYS = 90;
const TREND_WEEKS = 4;

export interface ImpactStats {
	hasConsumptionData: boolean;
	consumedThisWeek: number | null;
	consumedWeekOverWeek: ReturnType<typeof computeWeekOverWeek>;
	consumedTrend: WeeklyBar[];
	wasteTrend: WeeklyBar[];
	zeroWasteWeeks: number | null;
}

export interface StatistikRapportLink {
	month: string;
	href: string;
}

export interface StatistikDashboard {
	analytics: InventoryAnalytics;
	addedTrend: WeeklyBar[];
	addedWeekOverWeek: ReturnType<typeof computeWeekOverWeek>;
	impact: ImpactStats;
	savings: SavingsReport;
	spend: ReceiptSpendReport;
	highlights: HouseholdInsight[];
}

export class StatistikService {
	constructor(
		private readonly inventoryService: InventoryService,
		private readonly inventoryRepository: IInventoryRepository,
		private readonly consumptionRepository: IConsumptionRepository,
		private readonly householdRepository: IHouseholdRepository,
		private readonly priceMemoryRepository: IPriceMemoryRepository,
		private readonly mealPlanRepository: IMealPlanRepository
	) {}

	/** Lighter than getDashboard — used by /hem engagement strip. */
	async getSavingsReport(householdId: string): Promise<SavingsReport> {
		const events = await this.consumptionRepository.listEventsForSavings(householdId);
		return buildSavingsReport(events);
	}

	async getSpendReport(householdId: string): Promise<ReceiptSpendReport> {
		const referenceDate = new Date();
		try {
			const since = new Date(referenceDate);
			since.setUTCDate(since.getUTCDate() - SPEND_LOOKBACK_DAYS);
			const lines = await this.priceMemoryRepository.listSpendLinesSince(householdId, since);
			return buildReceiptSpendReport(lines, referenceDate);
		} catch (error) {
			console.warn('[statistik] getSpendReport degraded:', error);
			return buildReceiptSpendReport([], referenceDate);
		}
	}

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

	async getDashboard(householdId: string, userId?: string): Promise<StatistikDashboard> {
		const referenceDate = new Date();
		const weekRange = getWeekDateRange(referenceDate);
		const insightSince = new Date(referenceDate);
		insightSince.setUTCDate(insightSince.getUTCDate() - INSIGHT_LOOKBACK_DAYS);

		const [analytics, addedCounts, consumedCounts, wasteCounts, purchaseLines, plannedMealsThisWeek] =
			await Promise.all([
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
				),
				this.listPurchaseInsightLines(householdId, insightSince),
				userId
					? this.mealPlanRepository
							.listPlannedMealsByRange(userId, weekRange.from, weekRange.to)
							.then((meals) => meals.length)
					: Promise.resolve(0)
			]);

		const addedTrend = buildLastNWeekBars(addedCounts, TREND_WEEKS, referenceDate);
		const [impact, savings, spend] = await Promise.all([
			this.buildImpactStats(householdId, consumedCounts, wasteCounts, referenceDate),
			this.getSavingsReport(householdId),
			this.getSpendReport(householdId)
		]);

		const highlights = buildHouseholdInsights({
			purchaseLines,
			spend,
			impact,
			savings,
			analytics,
			plannedMealsThisWeek
		});

		return {
			analytics,
			addedTrend,
			addedWeekOverWeek: computeWeekOverWeek(addedTrend),
			impact,
			savings,
			spend,
			highlights
		};
	}

	private async listPurchaseInsightLines(householdId: string, since: Date) {
		try {
			return await this.priceMemoryRepository.listPurchaseInsightLinesSince(householdId, since);
		} catch (error) {
			console.warn('[statistik] listPurchaseInsightLines degraded:', error);
			return [];
		}
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

		let zeroWasteWeeks: number | null = null;
		if (hasConsumptionData) {
			const rawStreak = computeZeroWasteStreak(wasteTrend, consumedTrend);
			const household = await this.householdRepository.getHouseholdById(householdId);
			if (household) {
				const maxWeeks = weeksSinceHouseholdCreated(household.createdAt, referenceDate);
				zeroWasteWeeks = capZeroWasteStreak(rawStreak, maxWeeks);
			} else {
				zeroWasteWeeks = rawStreak;
			}
		}

		return {
			hasConsumptionData,
			consumedThisWeek,
			consumedWeekOverWeek: hasConsumptionData ? computeWeekOverWeek(consumedTrend) : null,
			consumedTrend,
			wasteTrend,
			zeroWasteWeeks
		};
	}
}
