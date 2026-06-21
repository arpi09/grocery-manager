import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { InventoryService } from '$lib/application/inventory.service';
import { PmfService } from '$lib/application/pmf.service';
import { PurchasePatternService } from '$lib/application/purchase-pattern.service';

import { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { receiptPurchaseLineTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import type { RequestEvent } from '@sveltejs/kit';

async function invokeBulkCreate(event: RequestEvent) {
	const { actions } = await import('./+page.server');
	const handler = actions.bulkCreate;
	if (!handler) throw new Error('bulkCreate action missing');
	return Promise.resolve(handler(event as Parameters<typeof handler>[0]));
}

let integrationDb: IntegrationDbContext;
let inventoryService: InventoryService;
let pmfService: PmfService;
let purchasePatternService: PurchasePatternService;
let learningEngineService: LearningEngineService;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

function bulkCreateRequest(fields: Record<string, string | string[]>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		if (Array.isArray(value)) {
			for (const entry of value) {
				body.append(key, entry);
			}
		} else {
			body.set(key, value);
		}
	}
	return new Request('http://localhost/scan?mode=photo', { method: 'POST', body });
}

function scanEvent(request: Request, user: { id: string }, householdId: string): RequestEvent {
	return {
		request,
		locals: {
			user,
			householdId,
			householdRole: 'owner' as const,
			inventoryService,
			pmfService,
			purchasePatternService,
			learningEngineService
		}
	} as RequestEvent;
}

async function expectRedirectTo(
	promise: Promise<unknown>,
	pathname: string
): Promise<{ location: string }> {
	await expect(promise).rejects.toMatchObject({
		status: 302,
		location: expect.stringContaining(pathname)
	});
	try {
		await promise;
	} catch (error) {
		return error as { location: string };
	}
	throw new Error('Expected redirect');
}

describe('Scan bulkCreate integration', () => {
	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		({ learningEngineService } = await import('$lib/server/di'));
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		inventoryService = new InventoryService(inventoryRepository);
		pmfService = new PmfService(new DrizzlePmfRepository());
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(),
			inventoryService,
			new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db))
		);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('photo bulkCreate redirects with items added', async () => {
		await integrationDb.seedUser({ id: 'user-photo', email: 'photo@example.com' });
		const householdId = await integrationDb.seedHousehold({
			name: 'Photo household',
			members: [{ userId: 'user-photo', role: 'owner' }]
		});

		const request = bulkCreateRequest({
			bulkFlow: 'photo',
			returnTo: '/hem',
			selected: ['0'],
			name_0: 'E2E Mjölk foto',
			quantity_0: '2',
			unit_0: 'st',
			location_0: 'fridge'
		});

		const redirect = await expectRedirectTo(
			invokeBulkCreate(scanEvent(request, { id: 'user-photo' }, householdId)),
			'/hem'
		);
		expect(redirect.location).toContain('scan=added');

		const listed = await inventoryService.listByLocation(householdId, 'fridge');
		const created = listed.find((item) => item.name === 'E2E Mjölk foto');
		expect(created).toBeDefined();
		expect(created!.expiresOn).not.toBeNull();
		expect(created!.expiresOnSource).toBe('ai_inferred');
	});

	it('photo bulkCreate saves explicit expiresOn and notes', async () => {
		await integrationDb.seedUser({ id: 'user-photo-expiry', email: 'photo-expiry@example.com' });
		const householdId = await integrationDb.seedHousehold({
			name: 'Photo expiry household',
			members: [{ userId: 'user-photo-expiry', role: 'owner' }]
		});

		const request = bulkCreateRequest({
			bulkFlow: 'photo',
			returnTo: '/hem',
			selected: ['0'],
			name_0: 'E2E Mjölk',
			quantity_0: '1',
			unit_0: 'l',
			location_0: 'fridge',
			expiresOn_0: '2026-08-01',
			notes_0: 'Arla 3%'
		});

		await expectRedirectTo(
			invokeBulkCreate(scanEvent(request, { id: 'user-photo-expiry' }, householdId)),
			'/hem'
		);

		const listed = await inventoryService.listByLocation(householdId, 'fridge');
		const created = listed.find((item) => item.name === 'E2E Mjölk');
		expect(created).toMatchObject({
			expiresOn: '2026-08-01',
			expiresOnSource: 'user_set',
			notes: 'Arla 3%'
		});
	});

	it('receipt bulkCreate records purchases and redirects', async () => {
		await integrationDb.seedUser({ id: 'user-receipt', email: 'receipt@example.com' });
		const householdId = await integrationDb.seedHousehold({
			name: 'Receipt household',
			members: [{ userId: 'user-receipt', role: 'owner' }]
		});

		const request = bulkCreateRequest({
			bulkFlow: 'receipt',
			returnTo: '/hem',
			selected: ['0'],
			name_0: 'E2E Kvitto vara',
			quantity_0: '1',
			unit_0: '',
			location_0: 'cupboard'
		});

		await expectRedirectTo(
			invokeBulkCreate(scanEvent(request, { id: 'user-receipt' }, householdId)),
			'/hem'
		);

		const listed = await inventoryService.listByLocation(householdId, 'cupboard');
		expect(listed.some((item) => item.name === 'E2E Kvitto vara')).toBe(true);
	});

	it('receipt bulkCreate stores priced lines with metadata and purchase rows', async () => {
		await integrationDb.seedUser({ id: 'user-receipt-rich', email: 'receipt-rich@example.com' });
		const householdId = await integrationDb.seedHousehold({
			name: 'Receipt rich household',
			members: [{ userId: 'user-receipt-rich', role: 'owner' }]
		});

		const request = bulkCreateRequest({
			bulkFlow: 'receipt',
			returnTo: '/hem',
			storeLabel: 'ICA Maxi',
			purchasedAt: '2026-06-20T14:30:00.000Z',
			selected: ['0', '1'],
			name_0: 'Mj�lk 3%',
			quantity_0: '1,5',
			unit_0: 'l',
			unitPrice_0: '19,90',
			lineTotal_0: '29,85',
			currency_0: 'SEK',
			location_0: 'fridge',
			expiresOn_0: '2026-06-27',
			predictedExpiresOn_0: '2026-06-25',
			predictedTypicalDays_0: '7',
			predictedModelVersion_0: 'heuristic-v1',
			predictedExpiresOnSource_0: 'ai_inferred',
			predictedLocation_0: 'fridge',
			predictedLocationModelVersion_0: 'heuristic-v1',
			name_1: 'Pasta',
			quantity_1: '2',
			unit_1: 'st',
			unitPrice_1: '12.50',
			lineTotal_1: '25.00',
			currency_1: 'SEK',
			location_1: 'cupboard'
		});

		await expectRedirectTo(
			invokeBulkCreate(scanEvent(request, { id: 'user-receipt-rich' }, householdId)),
			'/hem'
		);

		const purchaseRows = await integrationDb.db
			.select()
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.householdId, householdId));

		expect(purchaseRows).toHaveLength(2);
		expect(purchaseRows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					productName: 'Mj�lk 3%',
					quantity: '1.5',
					unitPrice: '19.90',
					lineTotal: '29.85',
					storeLabel: 'ICA Maxi',
					location: 'fridge'
				}),
				expect.objectContaining({
					productName: 'Pasta',
					quantity: '2',
					unitPrice: '12.50',
					lineTotal: '25.00',
					location: 'cupboard'
				})
			])
		);
	});

	it('receipt bulkCreate creates new item when merge target is missing', async () => {
		await integrationDb.seedUser({ id: 'user-receipt-merge', email: 'receipt-merge@example.com' });
		const householdId = await integrationDb.seedHousehold({
			name: 'Receipt merge household',
			members: [{ userId: 'user-receipt-merge', role: 'owner' }]
		});

		const request = bulkCreateRequest({
			bulkFlow: 'receipt',
			returnTo: '/hem',
			selected: ['0'],
			name_0: 'Merge fallback vara',
			quantity_0: '1',
			unit_0: 'st',
			location_0: 'fridge',
			merge_0: 'missing-inventory-id'
		});

		await expectRedirectTo(
			invokeBulkCreate(scanEvent(request, { id: 'user-receipt-merge' }, householdId)),
			'/hem'
		);

		const listed = await inventoryService.listByLocation(householdId, 'fridge');
		expect(listed.some((item) => item.name === 'Merge fallback vara')).toBe(true);
	});
});
