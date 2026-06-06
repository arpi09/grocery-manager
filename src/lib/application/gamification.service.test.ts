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
			getDashboard: vi.fn().mockResolvedValue({
				analytics: { totalItems: 8 },
				addedTrend: [],
				addedWeekOverWeek: null,
				impact: {
					hasConsumptionData: true,
					consumedThisWeek: 4,
					consumedWeekOverWeek: null,
					consumedTrend: [],
					wasteTrend: [],
					zeroWasteWeeks: 2
				},
				savings: {
					hasData: true,
					consumedCount: 4,
					wastedCount: 0,
					savedSek: 220,
					savedKg: 1,
					wastedSek: 0,
					wastedKg: 0,
					netSek: 220
				}
			}),
			getImpact: vi.fn(),
			getSavingsReport: vi.fn().mockResolvedValue({
				hasData: true,
				consumedCount: 4,
				wastedCount: 0,
				savedSek: 220,
				savedKg: 1,
				wastedSek: 0,
				wastedKg: 0,
				netSek: 220
			})
		} as unknown as StatistikService;
		consumptionRepository = {
			countByEventTypes: vi.fn(),
			countByEventTypeSince: vi.fn(),
			record: vi.fn(),
			weeklyCountsByEventType: vi.fn(),
			listEventsForSavings: vi.fn().mockResolvedValue([])
		} as unknown as IConsumptionRepository;
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
		vi.mocked(statistikService.getImpact).mockResolvedValue({
			hasConsumptionData: true,
			consumedThisWeek: 4,
			consumedWeekOverWeek: null,
			consumedTrend: [],
			wasteTrend: [],
			zeroWasteWeeks: 2
		});
		vi.mocked(mealPlanRepository.countRecipeIdeasSince).mockResolvedValue(3);
		vi.mocked(mealPlanRepository.countPlannedMealsSince).mockResolvedValue(1);
		vi.mocked(consumptionRepository.countByEventTypes).mockResolvedValue(2);
		vi.mocked(mealPlanRepository.hasAnyPlannedMeal).mockResolvedValue(true);
		vi.mocked(pmfRepository.hasHouseholdEvent).mockResolvedValue(false);

		const strip = await service.getEngagementStrip('household-1', 'user-1');

		expect(strip.consumedThisWeek).toBe(4);
		expect(strip.zeroWasteWeeks).toBe(2);
		expect(strip.eatFirst.complete).toBe(true);
		expect(strip.eatFirst.suggestionsThisWeek).toBe(3);
		expect(strip.nextMilestone?.id).toBe('firstReceipt');
	});

	it('evaluates a unified gamification snapshot', async () => {
		vi.mocked(statistikService.getImpact).mockResolvedValue({
			hasConsumptionData: true,
			consumedThisWeek: 2,
			consumedWeekOverWeek: null,
			consumedTrend: [],
			wasteTrend: [],
			zeroWasteWeeks: 5
		});
		vi.mocked(mealPlanRepository.countRecipeIdeasSince).mockResolvedValue(0);
		vi.mocked(mealPlanRepository.countPlannedMealsSince).mockResolvedValue(0);
		vi.mocked(consumptionRepository.countByEventTypes).mockResolvedValue(3);
		vi.mocked(mealPlanRepository.hasAnyPlannedMeal).mockResolvedValue(true);
		vi.mocked(pmfRepository.hasHouseholdEvent).mockImplementation(async (_id, type) => {
			return type === 'weekly_ritual_approved';
		});

		const snapshot = await service.evaluateProgress('household-1', 'user-1');

		expect(snapshot.savedSek).toBe(220);
		expect(snapshot.milestones.find((m) => m.id === 'streak5')?.achieved).toBe(true);
		expect(snapshot.engagement.nextMilestone).not.toBeNull();
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

	it('prefers streak5 celebration over zero-waste badge at 5 weeks', async () => {
		vi.mocked(statistikService.getImpact).mockResolvedValue({
			hasConsumptionData: true,
			consumedThisWeek: 1,
			consumedWeekOverWeek: null,
			consumedTrend: [],
			wasteTrend: [],
			zeroWasteWeeks: 5
		});

		await expect(service.detectZeroWasteCelebration('household-1')).resolves.toBe('streak5');
	});

	it('detects weekly ritual first celebration', async () => {
		vi.mocked(pmfRepository.hasHouseholdEvent).mockResolvedValue(true);

		await expect(service.detectWeeklyRitualFirstCelebration('household-1')).resolves.toBe(
			'weeklyRitualFirst'
		);
	});

	it('detects savings milestone celebration', async () => {
		vi.mocked(statistikService.getSavingsReport).mockResolvedValue({
			hasData: true,
			consumedCount: 10,
			wastedCount: 0,
			savedSek: 540,
			savedKg: 2,
			wastedSek: 0,
			wastedKg: 0,
			netSek: 540
		});

		await expect(service.detectSavingsCelebration('household-1')).resolves.toBe('savings500');
	});
});
