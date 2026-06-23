import { describe, expect, it, vi } from 'vitest';
import { PmfService } from '$lib/application/pmf.service';
import { recordSignupCompleteEvent } from './marketing-analytics';

function mockPmfRepository() {
	return {
		recordEvent: vi.fn().mockResolvedValue(undefined),
		getGlobalMetrics: vi.fn(),
		getFunnelMetrics: vi.fn(),
		getLaunchCohortSignups: vi.fn(),
		hasHouseholdEvent: vi.fn(),
		countHouseholdEventsSince: vi.fn(),
		countUserScanEvents: vi.fn(),
		getUserCreatedAt: vi.fn(),
		listRecentHouseholdSyncEvents: vi.fn().mockResolvedValue([]),
		getSyncFunnelCounts: vi.fn(),
		countDistinctHouseholdsWithEventSince: vi.fn(),
		getAcquisitionMetrics: vi.fn(),
		getMarketV01Metrics: vi.fn(),
		getBrainMetricsSince: vi.fn()
	};
}

describe('recordSignupCompleteEvent', () => {
	it('persists utm_* fields in signup_complete metadata', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-1', 'a', {
			visitorId: 'visitor-1',
			signupUtm: {
				source: 'reddit',
				medium: 'community',
				campaign: 'matsvinn_w12',
				content: 'post_a'
			}
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: null,
			eventType: 'signup_complete',
			metadata: {
				variant: 'a',
				visitorId: 'visitor-1',
				utm_source: 'reddit',
				utm_medium: 'community',
				utm_campaign: 'matsvinn_w12',
				utm_content: 'post_a'
			}
		});
	});

	it('records signup_from_shopping_share when utm_content is shopping_share', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-w1', 'a', {
			signupUtm: {
				source: 'skaffu',
				medium: 'product',
				campaign: 'acquisition_wedge',
				content: 'shopping_share'
			}
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledTimes(3);
		expect(repository.recordEvent).toHaveBeenNthCalledWith(2, {
			userId: 'user-w1',
			householdId: null,
			eventType: 'signup_from_shopping_share',
			metadata: expect.objectContaining({
				variant: 'a',
				utm_content: 'shopping_share'
			})
		});
		expect(repository.recordEvent).toHaveBeenNthCalledWith(3, {
			userId: 'user-w1',
			householdId: null,
			eventType: 'shared_list_signup_completed',
			metadata: expect.objectContaining({
				acquisition_source: 'shopping_share'
			})
		});
	});

	it('records shared_list_signup_completed for lista_join cookie intent', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-lista', 'a', {
			listaJoinPending: true
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledTimes(2);
		expect(repository.recordEvent).toHaveBeenNthCalledWith(2, {
			userId: 'user-lista',
			householdId: null,
			eventType: 'shared_list_signup_completed',
			metadata: expect.objectContaining({
				acquisition_source: 'lista_join'
			})
		});
	});

	it('records signup_from_expiring_share when utm_content is expiring_share', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-w3', 'b', {
			signupUtm: {
				source: 'skaffu',
				medium: 'product',
				campaign: 'acquisition_wedge',
				content: 'expiring_share'
			}
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledTimes(2);
		expect(repository.recordEvent).toHaveBeenNthCalledWith(2, {
			userId: 'user-w3',
			householdId: null,
			eventType: 'signup_from_expiring_share',
			metadata: expect.objectContaining({
				variant: 'b',
				utm_content: 'expiring_share'
			})
		});
	});

	it('records signup_from_expiring_share when utm_content is grannskafferiet', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-w3b', 'b', {
			signupUtm: {
				source: 'skaffu',
				medium: 'product',
				campaign: 'acquisition_wedge',
				content: 'grannskafferiet'
			}
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledTimes(2);
		expect(repository.recordEvent).toHaveBeenNthCalledWith(2, {
			userId: 'user-w3b',
			householdId: null,
			eventType: 'signup_from_expiring_share',
			metadata: expect.objectContaining({
				variant: 'b',
				utm_content: 'grannskafferiet'
			})
		});
	});

	it('omits utm keys when attribution is missing', async () => {
		const repository = mockPmfRepository();
		const service = new PmfService(repository);

		recordSignupCompleteEvent(service, 'user-2', 'b');

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-2',
			householdId: null,
			eventType: 'signup_complete',
			metadata: {
				variant: 'b'
			}
		});
	});
});
