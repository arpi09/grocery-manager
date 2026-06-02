import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import {
	inventoryItemTable,
	mealPlanTable,
	shoppingListItemTable,
	userTable
} from '$lib/infrastructure/db/schema';

const mockEnv = vi.hoisted(() => ({
	DEMO_ACCOUNT_EMAIL: undefined as string | undefined,
	DEMO_ACCOUNT_PASSWORD: 'demo-test-password' as string | undefined
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

import { DEMO_HOUSEHOLD_ID, seedDemoAccount } from './seed-demo';

let integrationDb: IntegrationDbContext;

describe('seedDemoAccount (integration)', () => {
	beforeEach(async () => {
		integrationDb = await createIntegrationDb();
		mockEnv.DEMO_ACCOUNT_EMAIL = 'demo-sales@example.com';
		mockEnv.DEMO_ACCOUNT_PASSWORD = 'demo-test-password';
	});

	afterEach(async () => {
		await integrationDb.close();
	});

	it('is idempotent and seeds inventory, shopping, and meals', async () => {
		const first = await seedDemoAccount();
		const second = await seedDemoAccount();

		expect(first.email).toBe('demo-sales@example.com');
		expect(second.userId).toBe(first.userId);

		const inventory = await integrationDb.db
			.select()
			.from(inventoryItemTable)
			.where(eq(inventoryItemTable.householdId, DEMO_HOUSEHOLD_ID));
		expect(inventory.length).toBe(15);

		const shopping = await integrationDb.db
			.select()
			.from(shoppingListItemTable)
			.where(eq(shoppingListItemTable.householdId, DEMO_HOUSEHOLD_ID));
		expect(shopping.length).toBe(5);

		const meals = await integrationDb.db
			.select()
			.from(mealPlanTable)
			.where(eq(mealPlanTable.userId, first.userId));
		expect(meals.length).toBe(4);

		const [user] = await integrationDb.db
			.select({ isDemo: userTable.isDemo })
			.from(userTable)
			.where(eq(userTable.id, first.userId));
		expect(user?.isDemo).toBe(true);
	});
});
