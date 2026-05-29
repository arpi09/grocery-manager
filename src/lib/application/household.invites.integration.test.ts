import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HouseholdService } from './household.service';
import { InventoryService, InventoryReadOnlyError } from './inventory.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Household invites integration', () => {
	let integrationDb: IntegrationDbContext;
	let householdService: HouseholdService;
	let inventoryService: InventoryService;
	const householdId = 'household-invite-test';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		householdService = new HouseholdService(householdRepository);
		inventoryService = new InventoryService(inventoryRepository);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedOwnerAndHousehold() {
		await integrationDb.seedUser({ id: 'owner-1', email: 'owner@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Test household',
			members: [{ userId: 'owner-1', role: 'owner' }]
		});
	}

	it('creates, lists and revokes pending invites', async () => {
		await seedOwnerAndHousehold();

		const { token, invite } = await householdService.createInvite(
			householdId,
			'owner-1',
			'viewer@example.com',
			'viewer'
		);

		expect(token).toBeTruthy();
		expect(invite.email).toBe('viewer@example.com');

		const pending = await householdService.listPendingInvites(householdId, 'owner-1');
		expect(pending).toHaveLength(1);
		expect(pending[0].id).toBe(invite.id);

		await householdService.revokeInvite(householdId, 'owner-1', invite.id);

		const afterRevoke = await householdService.listPendingInvites(householdId, 'owner-1');
		expect(afterRevoke).toHaveLength(0);
	});

	it('accepts invite and adds member with invited role', async () => {
		await seedOwnerAndHousehold();
		await integrationDb.seedUser({ id: 'viewer-1', email: 'viewer@example.com' });

		const { token } = await householdService.createInvite(
			householdId,
			'owner-1',
			'viewer@example.com',
			'viewer'
		);

		await householdService.acceptInvite(token, 'viewer-1', 'viewer@example.com');

		const role = await householdService.getRoleForUser(householdId, 'viewer-1');
		expect(role).toBe('viewer');
	});

	it('prevents viewer from creating inventory items', async () => {
		await integrationDb.seedUser({ id: 'owner-1', email: 'owner@example.com' });
		await integrationDb.seedUser({ id: 'viewer-1', email: 'viewer@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Test household',
			members: [
				{ userId: 'owner-1', role: 'owner' },
				{ userId: 'viewer-1', role: 'viewer' }
			]
		});

		await expect(
			inventoryService.createItem(
				householdId,
				'viewer-1',
				{ name: 'Blocked item', location: 'fridge', quantity: '1' },
				'viewer'
			)
		).rejects.toBeInstanceOf(InventoryReadOnlyError);

		await inventoryService.createItem(
			householdId,
			'owner-1',
			{ name: 'Allowed item', location: 'fridge', quantity: '1' },
			'owner'
		);

		const items = await inventoryService.listByLocation(householdId, 'fridge');
		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Allowed item');
	});

	it('allows editor to create inventory items', async () => {
		await integrationDb.seedUser({ id: 'owner-1', email: 'owner@example.com' });
		await integrationDb.seedUser({ id: 'editor-1', email: 'editor@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Test household',
			members: [
				{ userId: 'owner-1', role: 'owner' },
				{ userId: 'editor-1', role: 'editor' }
			]
		});

		const created = await inventoryService.createItem(
			householdId,
			'editor-1',
			{ name: 'Editor item', location: 'cupboard', quantity: '2' },
			'editor'
		);

		expect(created.name).toBe('Editor item');
	});
});
