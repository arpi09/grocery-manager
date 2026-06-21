import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountService } from '$lib/application/account.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import type { IAccountSessionRepository } from '$lib/application/account.service';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

describe('Account deletion integration', () => {
	let accountService: AccountService;
	let users: DrizzleUserRepository;
	let households: DrizzleHouseholdRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		users = new DrizzleUserRepository(integrationDb.db);
		households = new DrizzleHouseholdRepository(integrationDb.db);
		const sessions: IAccountSessionRepository = {
			invalidateUserSessions: async () => 0
		};
		accountService = new AccountService(users, households, sessions);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('deletes sole-member household and user', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'solo@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-1',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});

		await accountService.deleteAccount('user-1', 'RADERA');

		expect(await users.findById('user-1')).toBeNull();
		expect(await households.getHouseholdById('household-1')).toBeNull();
	});

	it('removes user from shared household and promotes successor owner', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'owner@example.com' });
		await integrationDb.seedUser({ id: 'user-2', email: 'editor@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-1',
			name: 'Hemma',
			members: [
				{ userId: 'user-1', role: 'owner' },
				{ userId: 'user-2', role: 'editor' }
			]
		});

		await accountService.deleteAccount('user-1', 'TA BORT');

		expect(await users.findById('user-1')).toBeNull();
		const household = await households.getHouseholdById('household-1');
		expect(household?.members).toHaveLength(1);
		expect(household?.members[0]?.userId).toBe('user-2');
		expect(household?.members[0]?.role).toBe('owner');
	});
});
