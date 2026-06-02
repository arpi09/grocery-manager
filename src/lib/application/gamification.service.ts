import type { ImpactStats, StatistikService } from '$lib/application/statistik.service';
import {
	buildMilestones,
	computeEatFirstRitualProgress,
	shouldCelebrateEatFirstRitual,
	shouldCelebrateFirstConsumption,
	shouldCelebrateZeroWasteStreak,
	type EatFirstRitualProgress,
	type GamificationCelebrationKind,
	type MilestoneState
} from '$lib/domain/gamification';
import { startOfWeek } from '$lib/domain/statistik';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';

export interface EngagementStrip {
	hasConsumptionData: boolean;
	consumedThisWeek: number | null;
	zeroWasteWeeks: number | null;
	eatFirst: EatFirstRitualProgress;
}

export class GamificationService {
	constructor(
		private readonly statistikService: StatistikService,
		private readonly consumptionRepository: IConsumptionRepository,
		private readonly mealPlanRepository: IMealPlanRepository,
		private readonly pmfRepository: IPmfRepository
	) {}

	async getEngagementStrip(householdId: string, userId: string): Promise<EngagementStrip> {
		const referenceDate = new Date();
		const weekStart = startOfWeek(referenceDate);
		const [impact, suggestionsThisWeek, mealsScheduledThisWeek] = await Promise.all([
			this.getImpactSummary(householdId),
			this.mealPlanRepository.countRecipeIdeasSince(userId, weekStart),
			this.mealPlanRepository.countPlannedMealsSince(userId, weekStart)
		]);

		return {
			hasConsumptionData: impact.hasConsumptionData,
			consumedThisWeek: impact.consumedThisWeek,
			zeroWasteWeeks: impact.zeroWasteWeeks,
			eatFirst: computeEatFirstRitualProgress(suggestionsThisWeek, mealsScheduledThisWeek)
		};
	}

	async getMilestones(householdId: string, userId: string): Promise<MilestoneState[]> {
		const [impact, analytics, consumedCount, hasPlannedMeal, hasReceipt] = await Promise.all([
			this.getImpactSummary(householdId),
			this.statistikService.getDashboard(householdId).then((dashboard) => dashboard.analytics),
			this.consumptionRepository.countByEventTypes(householdId, ['consumed']),
			this.mealPlanRepository.hasAnyPlannedMeal(userId),
			this.pmfRepository.hasHouseholdEvent(householdId, 'receipt_parsed')
		]);

		return buildMilestones({
			totalItems: analytics.totalItems,
			hasPlannedMeal,
			hasReceipt,
			consumedCount,
			zeroWasteWeeks: impact.zeroWasteWeeks
		});
	}

	async detectMarkFinishedCelebration(householdId: string): Promise<GamificationCelebrationKind | null> {
		const consumedCount = await this.consumptionRepository.countByEventTypes(householdId, [
			'consumed'
		]);
		return shouldCelebrateFirstConsumption(consumedCount) ? 'firstConsumption' : null;
	}

	async detectZeroWasteCelebration(householdId: string): Promise<GamificationCelebrationKind | null> {
		const impact = await this.getImpactSummary(householdId);
		return shouldCelebrateZeroWasteStreak(impact.zeroWasteWeeks) ? 'zeroWasteStreak' : null;
	}

	async detectEatFirstRitualCelebration(
		userId: string,
		referenceDate = new Date()
	): Promise<GamificationCelebrationKind | null> {
		const weekStart = startOfWeek(referenceDate);
		const scheduledThisWeek = await this.mealPlanRepository.countPlannedMealsSince(
			userId,
			weekStart
		);
		return shouldCelebrateEatFirstRitual(scheduledThisWeek - 1, scheduledThisWeek)
			? 'eatFirstRitual'
			: null;
	}

	private async getImpactSummary(householdId: string): Promise<ImpactStats> {
		const dashboard = await this.statistikService.getDashboard(householdId);
		return dashboard.impact;
	}
}
