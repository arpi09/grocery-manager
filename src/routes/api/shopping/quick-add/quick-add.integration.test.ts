import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { productEventTable, shoppingListItemTable } from '$lib/infrastructure/db/schema';
import { PmfService } from '$lib/application/pmf.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { POST } from './+server';

const { dbState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null }
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) throw new Error('Integration db not initialized');
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) throw new Error('Integration db not initialized');
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

describe('Shopping quick-add API integration', () => {
	let integrationDb: IntegrationDbContext;
	let shoppingListService: ShoppingListService;
	let pmfService: PmfService;
	const householdId = 'household-quick-add';
	const userId = 'user-quick-add';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		shoppingListService = new ShoppingListService(
			new DrizzleShoppingListRepository(integrationDb.db)
		);
		pmfService = new PmfService(new DrizzlePmfRepository());
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			members: [{ userId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	function apiLocals(role: 'owner' | 'viewer' = 'owner') {
		return {
			locale: 'sv' as const,
			user: { id: userId },
			householdId,
			householdRole: role,
			shoppingListService,
			pmfService
		};
	}

	function quickAddRequest(body: Record<string, unknown>) {
		return new Request('http://localhost/api/shopping/quick-add', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
	}

	async function waitForProductEvents(
		expectedCount: number
	): Promise<Array<{ eventType: string; metadata: string | null }>> {
		for (let attempt = 0; attempt < 20; attempt += 1) {
			const rows = await integrationDb.db
				.select({ eventType: productEventTable.eventType, metadata: productEventTable.metadata })
				.from(productEventTable)
				.where(eq(productEventTable.householdId, householdId));
			if (rows.length >= expectedCount) return rows;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		return [];
	}

	it('adds an item and records telemetry with the given source', async () => {
		const response = await POST({
			request: quickAddRequest({
				name: 'Yoghurt naturell',
				quantity: '1',
				source: 'home_expiring_card'
			}),
			locals: apiLocals()
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.ok).toBe(true);
		expect(payload.item.name).toBe('Yoghurt naturell');

		const items = await integrationDb.db
			.select()
			.from(shoppingListItemTable)
			.where(eq(shoppingListItemTable.householdId, householdId));
		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Yoghurt naturell');
		expect(items[0].checked).toBe(false);

		/* First row on an empty list also fires the loop-funnel event. */
		const events = await waitForProductEvents(2);
		expect(events).toHaveLength(2);
		const fill = events.find((event) => event.eventType === 'fill_suggestions_added');
		const first = events.find((event) => event.eventType === 'shopping_first_item_added');
		expect(JSON.parse(fill?.metadata ?? '{}').source).toBe('home_expiring_card');
		expect(JSON.parse(first?.metadata ?? '{}').surface).toBe('home_expiring_card');
	});

	it('falls back to quick_add_api for unknown sources', async () => {
		const response = await POST({
			request: quickAddRequest({ name: 'Mjölk', source: 'not-a-real-source' }),
			locals: apiLocals()
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);

		const events = await waitForProductEvents(2);
		expect(events).toHaveLength(2);
		const fill = events.find((event) => event.eventType === 'fill_suggestions_added');
		expect(JSON.parse(fill?.metadata ?? '{}').source).toBe('quick_add_api');
	});

	it('rejects viewers without write access', async () => {
		const response = await POST({
			request: quickAddRequest({ name: 'Smör' }),
			locals: apiLocals('viewer')
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(403);

		const items = await integrationDb.db
			.select()
			.from(shoppingListItemTable)
			.where(eq(shoppingListItemTable.householdId, householdId));
		expect(items).toHaveLength(0);
	});

	it('rejects empty names', async () => {
		const response = await POST({
			request: quickAddRequest({ name: '   ' }),
			locals: apiLocals()
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(400);
	});
});
