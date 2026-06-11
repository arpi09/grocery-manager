import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import { shoppingListShareLinkTable } from '$lib/infrastructure/db/schema';
import { DrizzleShoppingListShareRepository } from '$lib/infrastructure/repositories/shopping-list-share.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import { eq } from 'drizzle-orm';
import { ShoppingListShareService } from './shopping-list-share.service';

function shoppingItem(
	name: string,
	checked: boolean,
	overrides: Partial<ShoppingListItem> = {}
): ShoppingListItem {
	const now = new Date();
	return {
		id: crypto.randomUUID(),
		householdId: 'household-a',
		name,
		quantity: '1',
		unit: null,
		checked,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

describe('ShoppingListShareService', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleShoppingListShareRepository;
	let service: ShoppingListShareService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleShoppingListShareRepository(integrationDb.db);
		service = new ShoppingListShareService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-a' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			members: [{ userId: 'user-a', role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('returns preview for a valid token with checked and unchecked items', async () => {
		const created = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Mjölk', false),
			shoppingItem('Bröd', true)
		]);
		expect(created).not.toBeNull();

		const preview = await service.getSharePreview(created!.token);
		expect(preview).not.toBeNull();
		expect(preview!.items).toHaveLength(2);
		expect(preview!.items.map((item) => item.name)).toEqual(['Mjölk', 'Bröd']);
		expect(preview!.items[1]?.checked).toBe(true);
		expect(preview!.title).toBe('shoppingListShare.publicTitle');
		expect(preview!.snapshotAt).toBeTruthy();
	});

	it('returns null for an unknown token', async () => {
		await expect(service.getSharePreview('not-a-real-token')).resolves.toBeNull();
	});

	it('returns null for an expired token', async () => {
		const created = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Yoghurt', false)
		]);
		expect(created).not.toBeNull();

		await integrationDb.db
			.update(shoppingListShareLinkTable)
			.set({ expiresAt: new Date(Date.now() - 60_000) })
			.where(eq(shoppingListShareLinkTable.tokenHash, hashSecureToken(created!.token)));

		await expect(service.getSharePreview(created!.token)).resolves.toBeNull();
	});

	it('returns null for a revoked token', async () => {
		const first = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Ost', false)
		]);
		expect(first).not.toBeNull();

		const second = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Smör', false)
		]);
		expect(second).not.toBeNull();

		await expect(service.getSharePreview(first!.token)).resolves.toBeNull();
		await expect(service.getSharePreview(second!.token)).resolves.not.toBeNull();
	});

	it('revokes the previous active link when creating a new one', async () => {
		const first = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Första', false)
		]);
		const second = await service.createShareLink('household-a', 'user-a', [
			shoppingItem('Andra', false)
		]);

		expect(first!.token).not.toBe(second!.token);
		await expect(service.getSharePreview(first!.token)).resolves.toBeNull();
		await expect(service.getSharePreview(second!.token)).resolves.not.toBeNull();
	});
});
