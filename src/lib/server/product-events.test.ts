import { describe, expect, it, vi } from 'vitest';
import { PmfService } from '$lib/application/pmf.service';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { recordProductEvent } from './product-events';

function mockPmfRepository(overrides: Partial<IPmfRepository> = {}): IPmfRepository {
	return {
		recordEvent: vi.fn(),
		getGlobalMetrics: vi.fn(),
		getFunnelMetrics: vi.fn(),
		getLaunchCohortSignups: vi.fn(),
		hasHouseholdEvent: vi.fn(),
		countHouseholdEventsSince: vi.fn(),
		countUserScanEvents: vi.fn(),
		getUserCreatedAt: vi.fn(),
		...overrides
	};
}

describe('recordProductEvent', () => {
	it('delegates to pmf service without blocking', async () => {
		const repository = mockPmfRepository({
			recordEvent: vi.fn().mockResolvedValue(undefined)
		});
		const service = new PmfService(repository);

		recordProductEvent(service, {
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed'
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed'
		});
	});

	it('swallows repository errors', async () => {
		const repository = mockPmfRepository({
			recordEvent: vi.fn().mockRejectedValue(new Error('db down'))
		});
		const service = new PmfService(repository);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		recordProductEvent(service, {
			userId: 'user-1',
			householdId: null,
			eventType: 'receipt_parsed'
		});

		await Promise.resolve();

		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
