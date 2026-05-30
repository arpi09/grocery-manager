import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PmfService } from './pmf.service';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';

describe('PmfService', () => {
	let repository: IPmfRepository;
	let service: PmfService;

	beforeEach(() => {
		repository = {
			recordEvent: vi.fn(),
			getGlobalMetrics: vi.fn()
		};
		service = new PmfService(repository);
	});

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
				fill_suggestions_added: 2
			}
		};
		vi.mocked(repository.getGlobalMetrics).mockResolvedValue(metrics);

		const result = await service.getGlobalMetrics();

		expect(result).toEqual(metrics);
	});
});
