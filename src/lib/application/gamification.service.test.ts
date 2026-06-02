import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GamificationService } from './gamification.service';
import type { StatistikService } from './statistik.service';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import type { IMealPlanRepository } from '$lib/infrastructure/repositories/meal-plan.repository';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';

describe('GamificationService', () => {
	let statistikService: StatistikService;
	let consumptionRepository: IConsumptionRepository;
	let mealPlanRepository: IMealPlanRepository;
	let pmfRepository: IPmfRepository;
	let service: GamificationService;

	beforeEach(() => {
		statistikService = {
			getDashboard: vi.fn()
		} as unknown as StatistikService;
		consumptionRepository = {
			countByEventTypes: vi.fn(),
			countByEventTypeSince: vi.fn(),
			record: vi.fn(),
			weeklyCountsByEventType: vi.fn()
		};
		mealPlanRepository = {
			countRecipeIdeasSince: vi.fn(),
			countPlannedMealsSince: vi.fn(),
			hasAnyPlannedMeal: vi.fn()
		} as unknown as IMealPlanRepository;
		pmfRepository = {
			hasHouseholdEvent: vi.fn()
		} as unknown as IPmfRepository;
		service = new GamificationService(
			statistikService,
			consumptionRepository,
			mealPlanRepository,
			pmfRepository
		);
	});

	it('builds engagement strip from impact and weekly eat-first signals', async () => {
		vi.mocked(statistikService.getDashboard).mockResolvedValue({
			analytics: { totalItems: 5 } as never,
			addedTrend: [],
			addedWeekOverWeek: null,
			impact: {
				hasConsumptionData: true,
				consumedThisWeek: 4,
				consumedWeekOverWeek: null,
				consumedTrend: [],
				wasteTrend: [],
				zeroWasteWeeks: 2
			}
		});
		vi.mocked(mealPlanRepository.countRecipeIdeasSince).mockResolvedValue(3);
		vi.mocked(mealPlanRepository.countPlannedMealsSince).mockResolvedValue(1);

		const strip = await service.getEngagementStrip('household-1', 'user-1');

		expect(strip.consumedThisWeek).toBe(4);
		expect(strip.zeroWasteWeeks).toBe(2);
		expect(strip.eatFirst.complete).toBe(true);
		expect(strip.eatFirst.suggestionsThisWeek).toBe(3);
	});

	it('detects first consumption celebration', async () => {
		vi.mocked(consumptionRepository.countByEventTypes).mockResolvedValue(1);

		await expect(service.detectMarkFinishedCelebration('household-1')).resolves.toBe(
			'firstConsumption'
		);
	});

	it('detects eat-first ritual completion on first scheduled meal this week', async () => {
		vi.mocked(mealPlanRepository.countPlannedMealsSince).mockResolvedValue(1);

		await expect(service.detectEatFirstRitualCelebration('user-1')).resolves.toBe('eatFirstRitual');
	});
});
