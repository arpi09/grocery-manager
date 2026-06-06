import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatistikService } from './statistik.service';
import type { InventoryService, InventoryAnalytics } from './inventory.service';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
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
		service = new StatistikService(
			{ getAnalytics: vi.fn().mockResolvedValue(analyticsFixture) } as unknown as InventoryService,
			{ weeklyAddedCounts: vi.fn().mockResolvedValue([{ weekStart: previousWeek, count: 1 }, { weekStart: currentWeek, count: 4 }]) } as unknown as IInventoryRepository,
			consumptionRepository
		);
	});
	afterEach(() => vi.useRealTimers());

	it('combines analytics with trends and impact', async () => {
		const dashboard = await service.getDashboard('household-1');
		expect(dashboard.analytics.totalItems).toBe(12);
		expect(dashboard.impact.consumedThisWeek).toBe(2);
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
});
