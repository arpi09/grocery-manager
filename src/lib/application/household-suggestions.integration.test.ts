import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdSuggestionsService } from '$lib/application/household-suggestions.service';
import { DrizzleHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import { DrizzleHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

describe('Household suggestions integration', () => {
	let shelfLifeRepository: DrizzleHouseholdShelfLifeRuleRepository;
	let locationRepository: DrizzleHouseholdLocationRuleRepository;
	let service: HouseholdSuggestionsService;
	let householdId: string;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		shelfLifeRepository = new DrizzleHouseholdShelfLifeRuleRepository(integrationDb.db);
		locationRepository = new DrizzleHouseholdLocationRuleRepository(integrationDb.db);
		service = new HouseholdSuggestionsService(shelfLifeRepository, locationRepository);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		householdId = await integrationDb.seedHousehold({
			members: [{ userId: 'user-1', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('lists only rules with sample_count >= 1 and supports reset', async () => {
		await shelfLifeRepository.upsert({
			householdId,
			normalizedKey: 'mjolk',
			location: 'fridge',
			typicalDays: 7,
			sampleCount: 0,
			lastPredictedDays: 7
		});
		await shelfLifeRepository.upsert({
			householdId,
			normalizedKey: 'brod',
			location: 'cupboard',
			typicalDays: 4,
			sampleCount: 2,
			lastPredictedDays: 4
		});
		await locationRepository.upsert({
			householdId,
			normalizedKey: 'yoghurt',
			location: 'fridge',
			sampleCount: 1
		});

		const snapshot = await service.getSnapshot(householdId);

		expect(snapshot.shelfLifeRules).toHaveLength(1);
		expect(snapshot.shelfLifeRules[0]?.normalizedKey).toBe('brod');
		expect(snapshot.locationRules).toHaveLength(1);
		expect(snapshot.locationRules[0]?.normalizedKey).toBe('yoghurt');

		const deleted = await service.resetShelfLifeRule(householdId, 'brod', 'cupboard');
		expect(deleted).toBe(true);

		const afterReset = await service.getSnapshot(householdId);
		expect(afterReset.shelfLifeRules).toHaveLength(0);
		expect(afterReset.locationRules).toHaveLength(1);
	});
});
