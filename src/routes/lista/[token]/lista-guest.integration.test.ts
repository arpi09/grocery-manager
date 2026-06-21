import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { productEventTable } from '$lib/infrastructure/db/schema';
import { HouseholdService } from '$lib/application/household.service';
import { PmfService } from '$lib/application/pmf.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { ShoppingListShareService } from '$lib/application/shopping-list-share.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { DrizzleShoppingListShareRepository } from '$lib/infrastructure/repositories/shopping-list-share.repository';
import {
	buildListaLoginUrl,
	buildListaSignupUrl,
	LISTA_JOIN_COOKIE
} from '$lib/marketing/acquisition-attribution';
import { APP_HOME_PATH, INKOP_PATH } from '$lib/navigation/app-home';
import { consumeListaJoinCookie } from '$lib/server/lista-join-cookie';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

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

import { load as loadListaPage } from './+page.server';

function createCookieJar() {
	const jar = new Map<string, string>();
	return {
		jar,
		get: (name: string) => jar.get(name),
		set: (name: string, value: string) => {
			jar.set(name, value);
		},
		delete: (name: string) => {
			jar.delete(name);
		}
	};
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

describe('Lista guest join integration', () => {
	let integrationDb: IntegrationDbContext;
	let shoppingListService: ShoppingListService;
	let householdService: HouseholdService;
	let pmfService: PmfService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
		diState.shareService = new ShoppingListShareService(
			new DrizzleShoppingListShareRepository(integrationDb.db)
		);
		shoppingListService = new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db));
		householdService = new HouseholdService(new DrizzleHouseholdRepository(integrationDb.db));
		pmfService = new PmfService(new DrizzlePmfRepository());
	}, 60_000);

	beforeEach(async () => {
		await integrationDb.reset();
		shareFlag.enabled = true;
		await integrationDb.seedUser({ id: 'owner-a', email: 'owner@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			members: [{ userId: 'owner-a', role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		diState.shareService = null;
		await integrationDb.close();
	});

	async function createShareToken(itemNames: string[] = ['Mjölk']) {
		for (const name of itemNames) {
			await shoppingListService.addItem('household-a', 'owner', { name });
		}
		const created = await diState.shareService!.createShareLink(
			'household-a',
			'owner-a',
			await shoppingListService.listItems('household-a')
		);
		expect(created).not.toBeNull();
		return created!.token;
	}

	it('sets lista_join_token cookie for unauthenticated guest visit', async () => {
		const token = await createShareToken();
		const cookies = createCookieJar();

		const result = (await loadListaPage({
			params: { token },
			locals: { user: null, householdService, pmfService },
			cookies
		} as unknown as Parameters<typeof loadListaPage>[0])) as {
			preview: { items: Array<{ name: string }> };
			token: string;
		};

		expect(result.preview.items).toHaveLength(1);
		expect(result.token).toBe(token);
		expect(cookies.get(LISTA_JOIN_COOKIE)).toBe(token);
	});

	it('returns full item snapshot for guest preview (acquisition surface)', async () => {
		const token = await createShareToken([
			'Mjölk',
			'Bröd',
			'Ägg',
			'Smör',
			'Tomat',
			'Paprika'
		]);
		const cookies = createCookieJar();

		const result = (await loadListaPage({
			params: { token },
			locals: { user: null, householdService, pmfService },
			cookies
		} as unknown as Parameters<typeof loadListaPage>[0])) as {
			preview: { items: Array<{ name: string }> };
		};

		expect(result.preview.items).toHaveLength(6);
		expect(result.preview.items.map((item) => item.name)).toEqual([
			'Mjölk',
			'Bröd',
			'Ägg',
			'Smör',
			'Tomat',
			'Paprika'
		]);
	});

	it('signup URL uses shopping_share acquisition attribution for lista wedge', async () => {
		const signupUrl = buildListaSignupUrl('https://skaffu.com');

		expect(signupUrl).toContain('utm_content=shopping_share');
		expect(signupUrl).toContain('utm_campaign=acquisition_wedge');
	});

	it('exposes guest login URL that returns guest to lista after auth', async () => {
		const token = await createShareToken();

		expect(buildListaSignupUrl('https://skaffu.com')).toContain(
			`redirect=${encodeURIComponent(APP_HOME_PATH)}`
		);
		expect(buildListaLoginUrl(token)).toBe(
			`/login?redirect=${encodeURIComponent(`/lista/${token}`)}`
		);
	});

	it('returns 404 for unknown share token', async () => {
		const cookies = createCookieJar();

		await expect(
			loadListaPage({
				params: { token: 'unknown-token' },
				locals: { user: null, householdService, pmfService },
				cookies
			} as unknown as Parameters<typeof loadListaPage>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('returns 404 when shopping list share flag is disabled', async () => {
		shareFlag.enabled = false;
		const token = await createShareToken();
		const cookies = createCookieJar();

		await expect(
			loadListaPage({
				params: { token },
				locals: { user: null, householdService, pmfService },
				cookies
			} as unknown as Parameters<typeof loadListaPage>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('redirects authenticated visitor to inkop and joins shared household', async () => {
		const token = await createShareToken();
		await integrationDb.seedUser({ id: 'guest-b', email: 'guest@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-b',
			members: [{ userId: 'guest-b', role: 'owner' }]
		});

		const cookies = createCookieJar();
		await expectRedirectTo(
			Promise.resolve(
				loadListaPage({
					params: { token },
					locals: {
						user: { id: 'guest-b' },
						householdService,
						pmfService
					},
					cookies
				} as unknown as Parameters<typeof loadListaPage>[0])
			),
			INKOP_PATH
		);

		const role = await householdService.getRoleForUser('household-a', 'guest-b');
		expect(role).toBe('editor');
	});

	it('records partner_joined when guest joins via authenticated lista visit', async () => {
		const token = await createShareToken();
		await integrationDb.seedUser({ id: 'guest-c', email: 'guest-c@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-c',
			members: [{ userId: 'guest-c', role: 'owner' }]
		});

		const cookies = createCookieJar();
		await expectRedirectTo(
			Promise.resolve(
				loadListaPage({
					params: { token },
					locals: {
						user: { id: 'guest-c' },
						householdService,
						pmfService
					},
					cookies
				} as unknown as Parameters<typeof loadListaPage>[0])
			),
			INKOP_PATH
		);

		await vi.waitFor(async () => {
			const events = await integrationDb.db
				.select()
				.from(productEventTable)
				.where(eq(productEventTable.userId, 'guest-c'));
			expect(events.some((event) => (event.eventType as string) === 'partner_joined')).toBe(true);
		});
	});

	it('consumes lista_join_token cookie after auth and joins target household', async () => {
		const token = await createShareToken();
		await integrationDb.seedUser({ id: 'guest-d', email: 'guest-d@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-d',
			members: [{ userId: 'guest-d', role: 'owner' }]
		});

		const cookies = createCookieJar();
		cookies.set(LISTA_JOIN_COOKIE, token);

		const result = await consumeListaJoinCookie('guest-d', cookies, {
			shareService: diState.shareService!,
			householdService,
			pmfService
		});

		expect(result).toEqual({ targetHouseholdId: 'household-a', outcome: 'joined' });
		expect(cookies.get(LISTA_JOIN_COOKIE)).toBeUndefined();

		const role = await householdService.getRoleForUser('household-a', 'guest-d');
		expect(role).toBe('editor');

		await vi.waitFor(async () => {
			const events = await integrationDb.db
				.select()
				.from(productEventTable)
				.where(eq(productEventTable.userId, 'guest-d'));
			expect(events.some((event) => (event.eventType as string) === 'partner_joined')).toBe(true);
		});
	});

	it('clears invalid lista_join_token cookie without joining', async () => {
		await integrationDb.seedUser({ id: 'guest-e', email: 'guest-e@example.com' });
		const cookies = createCookieJar();
		cookies.set(LISTA_JOIN_COOKIE, 'invalid-token');

		const result = await consumeListaJoinCookie('guest-e', cookies, {
			shareService: diState.shareService!,
			householdService,
			pmfService
		});

		expect(result).toBeNull();
		expect(cookies.get(LISTA_JOIN_COOKIE)).toBeUndefined();
	});

	it('returns already_member when cookie join repeats for existing member', async () => {
		const token = await createShareToken();
		const cookies = createCookieJar();
		cookies.set(LISTA_JOIN_COOKIE, token);

		const result = await consumeListaJoinCookie('owner-a', cookies, {
			shareService: diState.shareService!,
			householdService,
			pmfService
		});

		expect(result).toEqual({ targetHouseholdId: 'household-a', outcome: 'already_member' });
		expect(cookies.get(LISTA_JOIN_COOKIE)).toBeUndefined();

		const events = await integrationDb.db
			.select()
			.from(productEventTable)
			.where(eq(productEventTable.userId, 'owner-a'));
		expect(events.some((event) => (event.eventType as string) === 'partner_joined')).toBe(false);
	});
});
