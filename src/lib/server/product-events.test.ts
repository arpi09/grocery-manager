import { describe, expect, it, vi } from 'vitest';
import { PmfService } from '$lib/application/pmf.service';
import { recordProductEvent } from './product-events';

describe('recordProductEvent', () => {
	it('delegates to pmf service without blocking', async () => {
		const repository = {
			recordEvent: vi.fn().mockResolvedValue(undefined),
			getGlobalMetrics: vi.fn()
		};
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
		const repository = {
			recordEvent: vi.fn().mockRejectedValue(new Error('db down')),
			getGlobalMetrics: vi.fn()
		};
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
