import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const { dbState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null }
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

import { GET as getNearbySettings, POST as postNearbySettings } from './nearby-settings/+server';
import { GET as getNearbyShares } from './nearby/+server';
import { POST as postNearbyPushSettings } from './nearby-push-settings/+server';

const STOCKHOLM = { latitude: 59.329323, longitude: 18.068581 };

function authedLocals(userId = 'user-1'): App.Locals {
	return {
		user: { id: userId, role: 'user' },
		householdId: 'household-1',
		locale: 'sv',
		planTier: 'free'
	} as App.Locals;
}

describe('Nearby sharing API integration', () => {
	let integrationDb: IntegrationDbContext;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-1',
			members: [{ userId: 'user-1', role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	it('POST nearby-settings opt-out clears nearby list for viewer', async () => {
		await postNearbySettings({
			request: new Request('http://localhost/api/expiring-share/nearby-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: true, ...STOCKHOLM })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbySettings>[0]);

		const optOut = await postNearbySettings({
			request: new Request('http://localhost/api/expiring-share/nearby-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: false })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbySettings>[0]);
		expect(optOut.status).toBe(200);
		await expect(optOut.json()).resolves.toMatchObject({ ok: true, enabled: false });

		const nearby = await getNearbyShares({ locals: authedLocals() } as Parameters<
			typeof getNearbyShares
		>[0]);
		expect(nearby.status).toBe(200);
		await expect(nearby.json()).resolves.toMatchObject({
			ok: true,
			optedIn: false,
			shares: []
		});
	});

	it('POST nearby-settings opt-in stores coarse location readable via GET', async () => {
		const optIn = await postNearbySettings({
			request: new Request('http://localhost/api/expiring-share/nearby-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: true, ...STOCKHOLM })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbySettings>[0]);
		expect(optIn.status).toBe(200);
		const optInBody = (await optIn.json()) as {
			ok: boolean;
			enabled: boolean;
			latitude: number;
			longitude: number;
		};
		expect(optInBody.ok).toBe(true);
		expect(optInBody.enabled).toBe(true);
		expect(optInBody.latitude).toBe(59.329);
		expect(optInBody.longitude).toBe(18.069);

		const getSettings = await getNearbySettings({
			locals: authedLocals()
		} as Parameters<typeof getNearbySettings>[0]);
		expect(getSettings.status).toBe(200);
		const getBody = (await getSettings.json()) as {
			ok: boolean;
			enabled: boolean;
			latitude: number;
			longitude: number;
		};
		expect(getBody.enabled).toBe(true);
		expect(getBody.latitude).toBe(59.329);
		expect(getBody.longitude).toBe(18.069);

		const nearby = await getNearbyShares({ locals: authedLocals() } as Parameters<
			typeof getNearbyShares
		>[0]);
		expect(nearby.status).toBe(200);
		const nearbyBody = (await nearby.json()) as { ok: boolean; optedIn: boolean };
		expect(nearbyBody.ok).toBe(true);
		expect(nearbyBody.optedIn).toBe(true);
	});

	it('POST nearby-push-settings rejects enable without push subscription', async () => {
		await postNearbySettings({
			request: new Request('http://localhost/api/expiring-share/nearby-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: true, ...STOCKHOLM })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbySettings>[0]);

		const enable = await postNearbyPushSettings({
			request: new Request('http://localhost/api/expiring-share/nearby-push-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: 'true' })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbyPushSettings>[0]);
		expect(enable.status).toBe(400);
		await expect(enable.json()).resolves.toMatchObject({ ok: false, error: 'push_required' });

		const disable = await postNearbyPushSettings({
			request: new Request('http://localhost/api/expiring-share/nearby-push-settings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ enabled: 'false' })
			}),
			locals: authedLocals()
		} as Parameters<typeof postNearbyPushSettings>[0]);
		expect(disable.status).toBe(200);
		await expect(disable.json()).resolves.toMatchObject({ ok: true, enabled: false });
	});
});
