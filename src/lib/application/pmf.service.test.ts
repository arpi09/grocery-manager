import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PmfService } from './pmf.service';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';

describe('PmfService', () => {
	let repository: IPmfRepository;
	let service: PmfService;

	beforeEach(() => {
		repository = {
			recordEvent: vi.fn(),
			getGlobalMetrics: vi.fn(),
			hasHouseholdEvent: vi.fn()
		};
		service = new PmfService(repository);
	});

	const metrics = {
		activationRate: 0.5,
		activatedUsers: 1,
		eligibleUsers: 2,
		medianTimeToFirstScanMinutes: 2,
		weeklyScanRate: 0.25,
		wauCount: 4,
		weeklyScanners: 1,
		d7Retention: 0.2,
		d7EligibleUsers: 5,
		d30Retention: 0.15,
		d30EligibleUsers: 3,
		multiMemberHouseholdRate: 0.5,
		activeHouseholds: 2,
		multiMemberActiveHouseholds: 1,
		smartFillWeeklyRate: 0.1,
		weeklyFillUsers: 1,
		eventCounts: {
			scan_completed: 3,
			receipt_parsed: 1,
			photo_round_parsed: 0,
			fill_suggestions_added: 2
		}
	};

	it('records product events', async () => {
		await service.recordEvent({
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed',
			metadata: { source: 'barcode' }
		});

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed',
			metadata: { source: 'barcode' }
		});
	});

	it('returns global PMF metrics', async () => {
		vi.mocked(repository.getGlobalMetrics).mockResolvedValue(metrics);

		const result = await service.getGlobalMetrics();

		expect(result).toEqual(metrics);
	});

	it('returns weekly review with current and prior-week snapshots', async () => {
		const now = new Date('2026-05-30T12:00:00Z');
		const previous = { ...metrics, activationRate: 0.4, d7Retention: 0.15 };
		vi.mocked(repository.getGlobalMetrics)
			.mockResolvedValueOnce(metrics)
			.mockResolvedValueOnce(previous);

		const review = await service.getWeeklyReview(now);

		expect(repository.getGlobalMetrics).toHaveBeenCalledTimes(2);
		expect(repository.getGlobalMetrics).toHaveBeenNthCalledWith(1, now);
		expect(repository.getGlobalMetrics).toHaveBeenNthCalledWith(
			2,
			new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		);
		expect(review.current).toEqual(metrics);
		expect(review.previous).toEqual(previous);
		expect(review.metrics).toHaveLength(7);
	});
});
