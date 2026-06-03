import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryService } from '$lib/application/inventory.service';
import { PmfService } from '$lib/application/pmf.service';
import { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server';

async function invokeBulkCreate(event: RequestEvent) {
	const handler = actions.bulkCreate;
	if (!handler) throw new Error('bulkCreate action missing');
	return Promise.resolve(handler(event as Parameters<typeof handler>[0]));
}

let integrationDb: IntegrationDbContext;
let inventoryService: InventoryService;
let pmfService: PmfService;
let purchasePatternService: PurchasePatternService;

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
			purchasePatternService
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
		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		inventoryService = new InventoryService(inventoryRepository);
		pmfService = new PmfService(new DrizzlePmfRepository());
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(),
			inventoryService
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
			name_0: 'E2E Foto vara',
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
		expect(listed.some((item) => item.name === 'E2E Foto vara')).toBe(true);
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
});
