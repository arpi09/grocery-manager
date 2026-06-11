import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleShoppingListShareRepository } from '$lib/infrastructure/repositories/shopping-list-share.repository';
import { ShoppingListShareService } from '$lib/application/shopping-list-share.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';

const { dbState, shareFlag, diState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	shareFlag: { enabled: true },
	diState: {
		shareService: null as ShoppingListShareService | null
	}
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) {
				throw new Error('Integration db not initialized');
			}
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) {
			throw new Error('Integration db not initialized');
		}
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

vi.mock('$lib/server/shopping-list-share-flag', () => ({
	isShoppingListShareEnabled: () => shareFlag.enabled
}));

vi.mock('$lib/server/di', () => ({
	get shoppingListShareService() {
		if (!diState.shareService) {
			throw new Error('Integration share service not initialized');
		}
		return diState.shareService;
	}
}));

vi.mock('$lib/server/product-events', () => ({
	recordProductEvent: vi.fn()
}));

import { POST as createShare } from './+server';
import { load as loadSharePage } from '../../../lista/[token]/+page.server';

describe('Shopping list share API integration', () => {
	let integrationDb: IntegrationDbContext;
	let shoppingListService: ShoppingListService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
		diState.shareService = new ShoppingListShareService(
			new DrizzleShoppingListShareRepository(integrationDb.db)
		);
		shoppingListService = new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db));
	});

	beforeEach(async () => {
		await integrationDb.reset();
		shareFlag.enabled = true;
		await integrationDb.seedUser({ id: 'user-a' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			members: [{ userId: 'user-a', role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		diState.shareService = null;
		await integrationDb.close();
	});

	it('blocks unauthenticated POST /api/shopping-list/share', async () => {
		const response = await createShare({
			locals: {
				locale: 'en',
				user: null,
				householdId: null,
				householdRole: null,
				shoppingListService
			},
			url: new URL('http://localhost/api/shopping-list/share'),
			request: new Request('http://localhost/api/shopping-list/share', { method: 'POST' })
		} as Parameters<typeof createShare>[0]);

		expect(response.status).toBe(401);
	});

	it('loads public preview without a session', async () => {
		await shoppingListService.addItem('household-a', 'owner', { name: 'Mjölk' });
		const created = await diState.shareService!.createShareLink(
			'household-a',
			'user-a',
			await shoppingListService.listItems('household-a')
		);
		expect(created).not.toBeNull();

		const result = (await loadSharePage({
			params: { token: created!.token }
		} as Parameters<typeof loadSharePage>[0])) as {
			preview: { items: Array<{ name: string }> };
			token: string;
		};

		expect(result.preview.items).toHaveLength(1);
		expect(result.preview.items[0]?.name).toBe('Mjölk');
		expect(result.token).toBe(created!.token);
	});
});
