import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';

const { dbState, pushEnv } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	pushEnv: {
		publicKey: undefined as string | undefined,
		privateKey: undefined as string | undefined
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

vi.mock('$env/dynamic/public', () => ({
	env: {
		get PUBLIC_VAPID_PUBLIC_KEY() {
			return pushEnv.publicKey;
		}
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: {
		get VAPID_PRIVATE_KEY() {
			return pushEnv.privateKey;
		}
	}
}));

import { GET as getVapidPublicKey } from './vapid-public-key/+server';
import { POST as subscribe } from './subscribe/+server';
import { POST as unsubscribe } from './unsubscribe/+server';
import { POST as disable } from './disable/+server';

const TEST_PUBLIC_KEY =
	'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjXuR2Y1Y2b0J5Q2Y1Y2b0J5Q2Y1Y2b0';
const TEST_PRIVATE_KEY = 'private-key-for-integration-tests-only';
const TEST_ENDPOINT = 'https://push.example.com/subscription/integration-1';

describe('Push API integration', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzlePushSubscriptionRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
		repository = new DrizzlePushSubscriptionRepository(integrationDb.db);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		pushEnv.publicKey = undefined;
		pushEnv.privateKey = undefined;
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	describe('GET /api/push/vapid-public-key', () => {
		it('returns 503 when VAPID public key is missing', async () => {
			const response = await getVapidPublicKey({
				locals: { locale: 'en' }
			} as Parameters<typeof getVapidPublicKey>[0]);
			expect(response.status).toBe(503);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.error).toBeTruthy();
		});

		it('returns 200 with public key when configured', async () => {
			pushEnv.publicKey = TEST_PUBLIC_KEY;

			const response = await getVapidPublicKey({} as Parameters<typeof getVapidPublicKey>[0]);
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({
				ok: true,
				publicKey: TEST_PUBLIC_KEY
			});
		});
	});

	describe('POST /api/push/subscribe', () => {
		it('returns 401 when unauthenticated', async () => {
			pushEnv.publicKey = TEST_PUBLIC_KEY;
			pushEnv.privateKey = TEST_PRIVATE_KEY;

			const response = await subscribe({
				request: new Request('http://localhost/api/push/subscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						endpoint: TEST_ENDPOINT,
						keys: { p256dh: 'p256dh-key', auth: 'auth-key' }
					})
				}),
				locals: { user: null, locale: 'en' } as App.Locals
			} as Parameters<typeof subscribe>[0]);

			expect(response.status).toBe(401);
		});

		it('returns 503 when push is not configured', async () => {
			await integrationDb.seedUser({ id: 'user-1' });

			const response = await subscribe({
				request: new Request('http://localhost/api/push/subscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						endpoint: TEST_ENDPOINT,
						keys: { p256dh: 'p256dh-key', auth: 'auth-key' }
					})
				}),
				locals: { user: { id: 'user-1' }, locale: 'en' } as App.Locals
			} as Parameters<typeof subscribe>[0]);

			expect(response.status).toBe(503);
			const body = await response.json();
			expect(body.ok).toBe(false);
			expect(body.error).toBeTruthy();
		});

		it('returns 200 and persists subscription when configured', async () => {
			pushEnv.publicKey = TEST_PUBLIC_KEY;
			pushEnv.privateKey = TEST_PRIVATE_KEY;
			await integrationDb.seedUser({ id: 'user-1' });

			const response = await subscribe({
				request: new Request('http://localhost/api/push/subscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						endpoint: TEST_ENDPOINT,
						keys: { p256dh: 'p256dh-key', auth: 'auth-key' }
					})
				}),
				locals: { user: { id: 'user-1' } } as App.Locals
			} as Parameters<typeof subscribe>[0]);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(await repository.isPushEnabled('user-1')).toBe(true);
			expect(await repository.listByUserId('user-1')).toHaveLength(1);
		});
	});

	describe('POST /api/push/unsubscribe', () => {
		it('returns 401 when unauthenticated', async () => {
			const response = await unsubscribe({
				request: new Request('http://localhost/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ endpoint: TEST_ENDPOINT })
				}),
				locals: { user: null, locale: 'en' } as App.Locals
			} as Parameters<typeof unsubscribe>[0]);

			expect(response.status).toBe(401);
		});

		it('returns 200 and clears subscription for authenticated user', async () => {
			await integrationDb.seedUser({ id: 'user-1' });
			await repository.upsert('user-1', {
				endpoint: TEST_ENDPOINT,
				p256dh: 'p256dh-key',
				auth: 'auth-key'
			});
			await repository.setPushEnabled('user-1', true);

			const response = await unsubscribe({
				request: new Request('http://localhost/api/push/unsubscribe', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ endpoint: TEST_ENDPOINT })
				}),
				locals: { user: { id: 'user-1' } } as App.Locals
			} as Parameters<typeof unsubscribe>[0]);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(await repository.listByUserId('user-1')).toHaveLength(0);
			expect(await repository.isPushEnabled('user-1')).toBe(false);
		});
	});

	describe('POST /api/push/disable', () => {
		it('returns 401 when unauthenticated', async () => {
			const response = await disable({
				request: new Request('http://localhost/api/push/disable', { method: 'POST' }),
				locals: { user: null, locale: 'en' } as App.Locals
			} as Parameters<typeof disable>[0]);

			expect(response.status).toBe(401);
		});

		it('returns 200 and clears all subscriptions without endpoint', async () => {
			await integrationDb.seedUser({ id: 'user-1' });
			await repository.upsert('user-1', {
				endpoint: TEST_ENDPOINT,
				p256dh: 'p256dh-key',
				auth: 'auth-key'
			});
			await repository.upsert('user-1', {
				endpoint: 'https://push.example.com/subscription/integration-2',
				p256dh: 'p256dh-key-2',
				auth: 'auth-key-2'
			});
			await repository.setPushEnabled('user-1', true);

			const response = await disable({
				request: new Request('http://localhost/api/push/disable', { method: 'POST' }),
				locals: { user: { id: 'user-1' } } as App.Locals
			} as Parameters<typeof disable>[0]);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(await repository.listByUserId('user-1')).toHaveLength(0);
			expect(await repository.isPushEnabled('user-1')).toBe(false);
		});
	});
});
