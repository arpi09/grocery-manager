import { describe, expect, it, vi } from 'vitest';
import type { StorageLocation } from '$lib/domain/location';
import { HouseholdSuggestionsService } from './household-suggestions.service';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';

describe('HouseholdSuggestionsService', () => {
	const shelfLifeRepository: IHouseholdShelfLifeRuleRepository = {
		findByKey: vi.fn(),
		listByHousehold: vi.fn(async () => [
			{
				householdId: 'hh-1',
				normalizedKey: 'mjolk',
				location: 'fridge' as StorageLocation,
				typicalDays: 7,
				sampleCount: 2,
				lastPredictedDays: 7,
				updatedAt: new Date('2026-01-01')
			}
		]),
		delete: vi.fn(),
		upsert: vi.fn()
	};

	const locationRepository: IHouseholdLocationRuleRepository = {
		findByKey: vi.fn(),
		listByHousehold: vi.fn(async () => []),
		delete: vi.fn(),
		upsert: vi.fn()
	};

	const service = new HouseholdSuggestionsService(shelfLifeRepository, locationRepository);

	it('maps repository rows to display views', async () => {
		const snapshot = await service.getSnapshot('hh-1');

		expect(snapshot.hasRules).toBe(true);
		expect(snapshot.shelfLifeRules).toEqual([
			{
				normalizedKey: 'mjolk',
				displayName: 'Mjolk',
				location: 'fridge',
				typicalDays: 7,
				sampleCount: 2
			}
		]);
		expect(snapshot.locationRules).toEqual([]);
	});

	it('delegates reset to repositories', async () => {
		vi.mocked(shelfLifeRepository.delete).mockResolvedValue(true);
		vi.mocked(locationRepository.delete).mockResolvedValue(true);

		await service.resetShelfLifeRule('hh-1', 'mjolk', 'fridge');
		await service.resetLocationRule('hh-1', 'mjolk');

		expect(shelfLifeRepository.delete).toHaveBeenCalledWith('hh-1', 'mjolk', 'fridge');
		expect(locationRepository.delete).toHaveBeenCalledWith('hh-1', 'mjolk');
	});
});
