import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HouseholdService } from './household.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Household multi-pantry integration', () => {
	let integrationDb: IntegrationDbContext;
	let householdService: HouseholdService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		householdService = new HouseholdService(new DrizzleHouseholdRepository(integrationDb.db));
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('switches active household and lists summaries', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'household-b',
			name: 'Stugan',
			members: [{ userId: 'user-1', role: 'editor' }]
		});

		const initial = await householdService.resolveActiveHouseholdId('user-1');
		expect(['household-a', 'household-b']).toContain(initial);

		await householdService.switchActiveHousehold('user-1', 'household-b');

		const households = await householdService.listHouseholdsForUser('user-1');
		expect(households).toHaveLength(2);
		expect(households.find((row) => row.id === 'household-b')?.isActive).toBe(true);
	});

	it('creates a new household and makes it active', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});

		const createdId = await householdService.createHousehold('user-1', 'Kontoret');
		const activeId = await householdService.resolveActiveHouseholdId('user-1');

		expect(activeId).toBe(createdId);

		const view = await householdService.getHouseholdForUser('user-1');
		expect(view?.name).toBe('Kontoret');
	});

	it('leaves a non-active household without changing active selection', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'household-b',
			name: 'Stugan',
			members: [{ userId: 'user-1', role: 'editor' }]
		});

		await householdService.switchActiveHousehold('user-1', 'household-a');
		await householdService.leaveHousehold('user-1', 'household-b');

		const households = await householdService.listHouseholdsForUser('user-1');
		expect(households).toHaveLength(1);
		expect(households[0].id).toBe('household-a');
	});
});
