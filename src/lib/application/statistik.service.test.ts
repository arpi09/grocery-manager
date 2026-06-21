import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatistikService } from './statistik.service';
import type { InventoryService, InventoryAnalytics } from './inventory.service';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import type { IPriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';
import { startOfWeek, toIsoDate } from '$lib/domain/statistik';

const analyticsFixture: InventoryAnalytics = {
	totalItems: 12, totalQuantity: '14', distinctProducts: 10, expiringSoonCount: 3,
	withoutExpiryCount: 2, lowStockCount: 1, addedLast7Days: 4,
	byLocation: [{ location: 'fridge', count: 5 }, { location: 'freezer', count: 2 }, { location: 'cupboard', count: 5 }],
	byLocationBars: [{ location: 'fridge', count: 5, percent: 42 }, { location: 'freezer', count: 2, percent: 17 }, { location: 'cupboard', count: 5, percent: 42 }]
};

describe('StatistikService', () => {
	const referenceDate = new Date('2026-06-04T12:00:00Z');
	let service: StatistikService;
	let consumptionRepository: IConsumptionRepository;
	let householdRepository: IHouseholdRepository;
	let priceMemoryRepository: IPriceMemoryRepository;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(referenceDate);
		const currentWeek = toIsoDate(startOfWeek(referenceDate));
		const previousWeekDate = startOfWeek(referenceDate);
		previousWeekDate.setUTCDate(previousWeekDate.getUTCDate() - 7);
		const previousWeek = toIsoDate(previousWeekDate);
		consumptionRepository = {
			record: vi.fn(),
			countByEventTypeSince: vi.fn().mockResolvedValue(2),
			weeklyCountsByEventType: vi.fn().mockImplementation((_h, types) => types.includes('consumed')
				? Promise.resolve([{ weekStart: previousWeek, count: 1 }, { weekStart: currentWeek, count: 2 }])
				: Promise.resolve([])),
			listEventsForSavings: vi.fn().mockResolvedValue([
				{ productName: 'Mjölk', eventType: 'consumed' },
				{ productName: 'Bröd', eventType: 'expired' }
			])
		} as unknown as IConsumptionRepository;
		householdRepository = {
			getHouseholdById: vi.fn().mockResolvedValue({
				id: 'household-1',
				name: 'Test',
				createdAt: referenceDate,
				members: []
			})
		} as unknown as IHouseholdRepository;
		priceMemoryRepository = {
			listSpendLinesSince: vi.fn().mockResolvedValue([
				{
					purchasedAt: new Date('2026-06-10T10:00:00Z'),
					lineTotalSek: 100,
					unitPriceSek: null,
					quantity: null,
					storeLabel: 'ICA',
					importBatchId: 'batch-1'
				}
			])
		} as unknown as IPriceMemoryRepository;
		service = new StatistikService(
			{ getAnalytics: vi.fn().mockResolvedValue(analyticsFixture) } as unknown as InventoryService,
			{ weeklyAddedCounts: vi.fn().mockResolvedValue([{ weekStart: previousWeek, count: 1 }, { weekStart: currentWeek, count: 4 }]) } as unknown as IInventoryRepository,
			consumptionRepository,
			householdRepository,
			priceMemoryRepository
		);
	});
	afterEach(() => vi.useRealTimers());

	it('combines analytics with trends and impact', async () => {
		const dashboard = await service.getDashboard('household-1');
		expect(dashboard.analytics.totalItems).toBe(12);
		expect(dashboard.impact.consumedThisWeek).toBe(2);
		expect(dashboard.spend.hasData).toBe(true);
		expect(dashboard.spend.thisMonthSek).toBe(100);
	});

	it('builds spend report from receipt lines', async () => {
		const spend = await service.getSpendReport('household-1');
		expect(spend.hasData).toBe(true);
		expect(spend.thisMonthSek).toBe(100);
		expect(priceMemoryRepository.listSpendLinesSince).toHaveBeenCalledWith(
			'household-1',
			expect.any(Date)
		);
	});

	it('returns empty spend report when price memory lookup fails', async () => {
		vi.mocked(priceMemoryRepository.listSpendLinesSince).mockRejectedValue(
			new Error('receipt_purchase_line missing')
		);
		const spend = await service.getSpendReport('household-1');
		expect(spend.hasData).toBe(false);
		expect(spend.thisMonthSek).toBe(0);
	});

	it('returns null impact without consumption history', async () => {
		vi.mocked(consumptionRepository.weeklyCountsByEventType).mockResolvedValue([]);
		const dashboard = await service.getDashboard('household-1');
		expect(dashboard.impact.consumedThisWeek).toBeNull();
	});

	it('builds savings report from consumption events', async () => {
		const savings = await service.getSavingsReport('household-1');
		expect(savings.hasData).toBe(true);
		expect(savings.consumedCount).toBe(1);
		expect(savings.wastedCount).toBe(1);
		expect(consumptionRepository.listEventsForSavings).toHaveBeenCalledWith('household-1');
	});

	it('caps zero-waste weeks at weeks since first consumption', async () => {
		const currentWeek = toIsoDate(startOfWeek(referenceDate));
		vi.mocked(consumptionRepository.weeklyCountsByEventType).mockImplementation((_h, types) =>
			types.includes('consumed')
				? Promise.resolve([{ weekStart: currentWeek, count: 3 }])
				: Promise.resolve([])
		);

		const impact = await service.getImpact('household-new');
		expect(impact.zeroWasteWeeks).toBe(1);
	});

	it('caps zero-waste weeks at weeks since household created', async () => {
		const currentWeek = toIsoDate(startOfWeek(referenceDate));
		const previousWeekDate = startOfWeek(referenceDate);
		previousWeekDate.setUTCDate(previousWeekDate.getUTCDate() - 7);
		const previousWeek = toIsoDate(previousWeekDate);
		const twoWeeksAgoDate = new Date(previousWeekDate);
		twoWeeksAgoDate.setUTCDate(twoWeeksAgoDate.getUTCDate() - 7);
		const twoWeeksAgo = toIsoDate(twoWeeksAgoDate);
		const threeWeeksAgoDate = new Date(twoWeeksAgoDate);
		threeWeeksAgoDate.setUTCDate(threeWeeksAgoDate.getUTCDate() - 7);
		const threeWeeksAgo = toIsoDate(threeWeeksAgoDate);

		vi.mocked(consumptionRepository.weeklyCountsByEventType).mockImplementation((_h, types) =>
			types.includes('consumed')
				? Promise.resolve([
						{ weekStart: threeWeeksAgo, count: 1 },
						{ weekStart: twoWeeksAgo, count: 1 },
						{ weekStart: previousWeek, count: 1 },
						{ weekStart: currentWeek, count: 1 }
					])
				: Promise.resolve([])
		);
		vi.mocked(householdRepository.getHouseholdById).mockResolvedValue({
			id: 'household-new',
			name: 'New',
			createdAt: referenceDate,
			members: []
		});

		const impact = await service.getImpact('household-new');
		expect(impact.zeroWasteWeeks).toBe(1);
	});
});
