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
		getUserCreatedAt: vi.fn()
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
