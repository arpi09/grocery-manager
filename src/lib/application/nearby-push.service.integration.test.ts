import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { NEARBY_PUSH_DEBOUNCE_MS } from '$lib/domain/nearby-push';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { DrizzleNearbyPushRepository } from '$lib/infrastructure/repositories/nearby-push.repository';
import { DrizzlePushSubscriptionRepository } from '$lib/infrastructure/repositories/push-subscription.repository';
import { NearbyPushService } from './nearby-push.service';
import { ExpiringShareService } from './expiring-share.service';
import { eq } from 'drizzle-orm';
import { householdTable, pushSubscriptionTable, userTable } from '$lib/infrastructure/db/schema';

const STOCKHOLM = { latitude: 59.329323, longitude: 18.068581 };
const NEARBY = { latitude: 59.332, longitude: 18.072 };
const MID_RANGE = { latitude: 59.338, longitude: 18.08 };

function expiringItem(name: string): InventoryItem {
	const now = new Date();
	const expiresOn = new Date();
	expiresOn.setDate(expiresOn.getDate() + 2);

	return {
		id: crypto.randomUUID(),
		householdId: 'household-a',
		userId: 'user-a',
		name,
		location: 'fridge',
		quantity: '1',
		unit: null,
		expiresOn: expiresOn.toISOString().slice(0, 10),
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: now,
		createdAt: now,
		updatedAt: now
	};
}

describe('NearbyPushService — integration', () => {
	let integrationDb: IntegrationDbContext;
	let expiringShareRepository: DrizzleExpiringShareRepository;
	let nearbyPushRepository: DrizzleNearbyPushRepository;
	let pushRepository: DrizzlePushSubscriptionRepository;
	let expiringShareService: ExpiringShareService;
	let pushSent = false;

	const push = {
		sendNotification: async () => {
			pushSent = true;
			return { ok: true as const, delivered: 1 };
		}
	};
	const appOrigin = { getOrigin: () => 'https://skaffu.test' };

	let nearbyPushService: NearbyPushService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		expiringShareRepository = new DrizzleExpiringShareRepository(integrationDb.db);
		nearbyPushRepository = new DrizzleNearbyPushRepository(integrationDb.db);
		pushRepository = new DrizzlePushSubscriptionRepository(integrationDb.db);
		expiringShareService = new ExpiringShareService(expiringShareRepository);
		nearbyPushService = new NearbyPushService(
			nearbyPushRepository,
			expiringShareRepository,
			pushRepository,
			push,
			appOrigin
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		pushSent = false;
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedViewer(opts?: { debounced?: boolean; pro?: boolean }) {
		await integrationDb.seedUser({ id: 'viewer-user' });
		await integrationDb.seedHousehold({
			id: 'viewer-household',
			members: [{ userId: 'viewer-user', role: 'owner' }]
		});
		if (opts?.pro) {
			await integrationDb.db
				.update(householdTable)
				.set({ planTier: 'pro' })
				.where(eq(householdTable.id, 'viewer-household'));
		}
		await integrationDb.db
			.update(userTable)
			.set({
				activeHouseholdId: 'viewer-household',
				nearbySharingEnabled: true,
				nearbySharingLat: String(STOCKHOLM.latitude),
				nearbySharingLng: String(STOCKHOLM.longitude),
				nearbyPushEnabled: true,
				pushNotificationsEnabled: true,
				nearbyPushLastSentAt: opts?.debounced
					? new Date(Date.now() - NEARBY_PUSH_DEBOUNCE_MS + 60_000)
					: null
			})
			.where(eq(userTable.id, 'viewer-user'));
		await integrationDb.db.insert(pushSubscriptionTable).values({
			id: 'sub-viewer',
			userId: 'viewer-user',
			endpoint: 'https://push.example.com/viewer',
			p256dh: 'key',
			auth: 'auth',
			createdAt: new Date()
		});
	}

	async function seedSharerAndShare(coordinate = NEARBY) {
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});
		await expiringShareService.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		const share = await expiringShareService.createShareLink(
			'sharer-household',
			'sharer-user',
			[expiringItem('Mjölk'), expiringItem('Yoghurt')],
			{ attachNearby: true, coordinate }
		);
		return share!;
	}

	it('sends push to opted-in viewer near share', async () => {
		await seedViewer();
		const share = await seedSharerAndShare();

		const result = await nearbyPushService.notifyNearbyViewers(share.shareId);

		expect(result.status).toBe('sent');
		expect(pushSent).toBe(true);
	});

	it('skips debounced viewer', async () => {
		await seedViewer({ debounced: true });
		const share = await seedSharerAndShare();

		const result = await nearbyPushService.notifyNearbyViewers(share.shareId);

		expect(result).toEqual({ status: 'skipped', reason: 'no_viewers' });
		expect(pushSent).toBe(false);
	});

	it('createShareLink triggers notify path via share id', async () => {
		await seedViewer();
		const share = await seedSharerAndShare();
		expect(share.shareId).toBeTruthy();

		const result = await nearbyPushService.notifyNearbyViewers(share.shareId);
		expect(result.status).toBe('sent');
	});
});

describe('ExpiringShareService — pro radius', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleExpiringShareRepository;
	let service: ExpiringShareService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleExpiringShareRepository(integrationDb.db);
		service = new ExpiringShareService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('pro viewer sees share within 2 km that free viewer misses', async () => {
		await integrationDb.seedUser({ id: 'free-viewer' });
		await integrationDb.seedUser({ id: 'pro-viewer' });
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'free-household',
			members: [{ userId: 'free-viewer', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'pro-household',
			members: [{ userId: 'pro-viewer', role: 'owner' }]
		});
		await integrationDb.db
			.update(householdTable)
			.set({ planTier: 'pro' })
			.where(eq(householdTable.id, 'pro-household'));
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});

		await service.updateNearbySharingSettings('free-viewer', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('pro-viewer', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: MID_RANGE
		});

		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Ost')], {
			attachNearby: true,
			coordinate: MID_RANGE
		});

		const freeResult = await service.listNearbyShares('free-viewer', 'free-household', {
			viewerPlanTier: 'free'
		});
		const proResult = await service.listNearbyShares('pro-viewer', 'pro-household', {
			viewerPlanTier: 'pro'
		});

		expect(freeResult.radiusM).toBe(500);
		expect(proResult.radiusM).toBe(2000);
		expect(freeResult.shares).toHaveLength(0);
		expect(proResult.shares).toHaveLength(1);
	});
});
