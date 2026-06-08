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
			getFunnelMetrics: vi.fn(),
			getLaunchCohortSignups: vi.fn(),
			hasHouseholdEvent: vi.fn(),
			countHouseholdEventsSince: vi.fn(),
			countUserScanEvents: vi.fn(),
			getUserCreatedAt: vi.fn()
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
		weeklyRitualRate: 0.05,
		weeklyRitualUsers: 1,
		wrappedRate: 0.1,
		mauCount: 10,
		wrappedViewers: 1,
		receiptRate: 0.2,
		receiptUsers: 1,
		inviteRate: 0.25,
		newHouseholds: 4,
		multiMemberNewHouseholds: 1,
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

	const funnelSnapshot = {
		periodDays: 7 as const,
		periodStart: new Date('2026-05-23T12:00:00Z'),
		periodEnd: new Date('2026-05-30T12:00:00Z'),
		visits: 120,
		visitsSource: 'landing_view' as const,
		signups: 12,
		firstScans: 6,
		d1Retention: 0.25,
		d1EligibleUsers: 4,
		d1RetainedUsers: 1
	};

	it('returns funnel metrics for the selected period', async () => {
		vi.mocked(repository.getFunnelMetrics).mockResolvedValue(funnelSnapshot);

		const result = await service.getFunnelMetrics(30);

		expect(repository.getFunnelMetrics).toHaveBeenCalledWith(30, undefined);
		expect(result).toEqual(funnelSnapshot);
	});

	it('parses funnel period days', () => {
		expect(service.parseFunnelPeriodDays('30')).toBe(30);
		expect(service.parseFunnelPeriodDays('7')).toBe(7);
		expect(service.parseFunnelPeriodDays('invalid')).toBe(7);
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
		expect(review.metrics).toHaveLength(11);
	});
});
