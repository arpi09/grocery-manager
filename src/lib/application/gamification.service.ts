import type { ImpactStats, StatistikService } from '$lib/application/statistik.service';

import {

	buildMilestones,

	computeEatFirstRitualProgress,

	shouldCelebrateEatFirstRitual,

	shouldCelebrateFirstConsumption,

	shouldCelebrateSavingsMilestone,

	shouldCelebrateStreakMilestone,

	shouldCelebrateWeeklyRitualFirst,

	shouldCelebrateSyncWeek,

	shouldCelebrateZeroWasteStreak,

	type EatFirstRitualProgress,

	type GamificationCelebrationKind,

	type MilestoneState

} from '$lib/domain/gamification';

import {

	resolveNextMilestone,

	type NextMilestoneProgress

} from '$lib/domain/gamification.registry';

import { startOfWeek } from '$lib/domain/statistik';
import { SYNC_ANALYTICS_EVENTS } from '$lib/domain/sync-analytics';

import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';

import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';

import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';



export interface EngagementStrip {

	hasConsumptionData: boolean;

	consumedThisWeek: number | null;

	zeroWasteWeeks: number | null;

	eatFirst: EatFirstRitualProgress;

	nextMilestone: NextMilestoneProgress | null;

	syncWeekWrites: number;
	bridgeCheckoffsThisWeek: number;

}



export interface GamificationSnapshot {

	engagement: EngagementStrip;

	milestones: MilestoneState[];

	savedSek: number;

}



export class GamificationService {

	constructor(

		private readonly statistikService: StatistikService,

		private readonly consumptionRepository: IConsumptionRepository,

		private readonly mealPlanRepository: IMealPlanRepository,

		private readonly pmfRepository: IPmfRepository

	) {}



	async evaluateProgress(householdId: string, userId: string): Promise<GamificationSnapshot> {

		const [engagement, milestones, savings] = await Promise.all([

			this.getEngagementStrip(householdId, userId),

			this.getMilestones(householdId, userId),

			this.statistikService.getSavingsReport(householdId)

		]);



		return {

			engagement,

			milestones,

			savedSek: savings.savedSek

		};

	}



	async getEngagementStrip(householdId: string, userId: string): Promise<EngagementStrip> {

		const referenceDate = new Date();

		const weekStart = startOfWeek(referenceDate);

		const [impact, analytics, savings, suggestionsThisWeek, mealsScheduledThisWeek, milestones] =

			await Promise.all([

				this.getImpactSummary(householdId),

				this.statistikService.getDashboard(householdId).then((dashboard) => dashboard.analytics),

				this.statistikService.getSavingsReport(householdId),

				this.mealPlanRepository.countRecipeIdeasSince(userId, weekStart),

				this.mealPlanRepository.countPlannedMealsSince(userId, weekStart),

				this.getMilestones(householdId, userId)

			]);

		const [syncWeekWrites, bridgeCheckoffsThisWeek] = await Promise.all([
			this.pmfRepository.countHouseholdEventsSince(
				householdId,
				SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE,
				weekStart
			),
			this.pmfRepository.countHouseholdEventsSince(
				householdId,
				SYNC_ANALYTICS_EVENTS.SHOPPING_CHECKOFF_TO_PANTRY,
				weekStart
			)
		]);



		return {

			hasConsumptionData: impact.hasConsumptionData,

			consumedThisWeek: impact.consumedThisWeek,

			zeroWasteWeeks: impact.zeroWasteWeeks,

			eatFirst: computeEatFirstRitualProgress(suggestionsThisWeek, mealsScheduledThisWeek),
			syncWeekWrites,
			bridgeCheckoffsThisWeek,

			nextMilestone: resolveNextMilestone(milestones, {

				totalItems: analytics.totalItems,

				zeroWasteWeeks: impact.zeroWasteWeeks,

				savedSek: savings.savedSek

			})

		};

	}



	async getMilestones(householdId: string, userId: string): Promise<MilestoneState[]> {

		const [impact, analytics, savings, consumedCount, hasPlannedMeal, hasReceipt, hasWeeklyRitual] =

			await Promise.all([

				this.getImpactSummary(householdId),

				this.statistikService.getDashboard(householdId).then((dashboard) => dashboard.analytics),

				this.statistikService.getSavingsReport(householdId),

				this.consumptionRepository.countByEventTypes(householdId, ['consumed']),

				this.mealPlanRepository.hasAnyPlannedMeal(userId),

				this.pmfRepository.hasHouseholdEvent(householdId, 'receipt_parsed'),

				this.pmfRepository.hasHouseholdEvent(householdId, 'weekly_ritual_approved')

			]);



		return buildMilestones({

			totalItems: analytics.totalItems,

			hasPlannedMeal,

			hasReceipt,

			consumedCount,

			zeroWasteWeeks: impact.zeroWasteWeeks,

			hasWeeklyRitual,

			savedSek: savings.savedSek

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

		if (shouldCelebrateStreakMilestone(impact.zeroWasteWeeks)) {

			return 'streak5';

		}

		return shouldCelebrateZeroWasteStreak(impact.zeroWasteWeeks) ? 'zeroWasteStreak' : null;

	}

	async detectSyncWeekCelebration(
		householdId: string,
		referenceDate = new Date()
	): Promise<GamificationCelebrationKind | null> {
		const weekStart = startOfWeek(referenceDate);
		const writes = await this.pmfRepository.countHouseholdEventsSince(
			householdId,
			SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE,
			weekStart
		);
		return shouldCelebrateSyncWeek(writes) ? 'syncWeek' : null;
	}

	async detectHomeCelebration(householdId: string): Promise<GamificationCelebrationKind | null> {
		return (
			(await this.detectZeroWasteCelebration(householdId)) ??
			(await this.detectSyncWeekCelebration(householdId))
		);
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



	async detectWeeklyRitualFirstCelebration(

		householdId: string

	): Promise<GamificationCelebrationKind | null> {

		const hasWeeklyRitual = await this.pmfRepository.hasHouseholdEvent(

			householdId,

			'weekly_ritual_approved'

		);

		return shouldCelebrateWeeklyRitualFirst(hasWeeklyRitual) ? 'weeklyRitualFirst' : null;

	}



	async detectSavingsCelebration(householdId: string): Promise<GamificationCelebrationKind | null> {

		const savings = await this.statistikService.getSavingsReport(householdId);

		return shouldCelebrateSavingsMilestone(savings.savedSek) ? 'savings500' : null;

	}



	private getImpactSummary(householdId: string): Promise<ImpactStats> {

		return this.statistikService.getImpact(householdId);

	}

}

