import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { MarketChatService } from './market-chat.service';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleMarketChatRepository } from '$lib/infrastructure/repositories/market-chat.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { PmfService } from './pmf.service';
import { hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import {
	expiringShareBlockTable,
	expiringShareLinkTable,
	userTable
} from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const STOCKHOLM = { latitude: 59.329323, longitude: 18.068581 };
const NEARBY = { latitude: 59.332, longitude: 18.072 };

describe('MarketChatService — integration', () => {
	let integrationDb: IntegrationDbContext;
	let service: MarketChatService;
	let expiringShareRepository: DrizzleExpiringShareRepository;

	const sharerUserId = 'market-chat-sharer';
	const sharerHouseholdId = 'market-chat-sharer-household';
	const seekerUserId = 'market-chat-seeker';
	const seekerHouseholdId = 'market-chat-seeker-household';
	const outsiderUserId = 'market-chat-outsider';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		expiringShareRepository = new DrizzleExpiringShareRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		const marketChatRepository = new DrizzleMarketChatRepository(integrationDb.db);
		const pmfService = new PmfService(new DrizzlePmfRepository());

		service = new MarketChatService(
			marketChatRepository,
			expiringShareRepository,
			householdRepository,
			pmfService
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: sharerUserId });
		await integrationDb.seedUser({ id: seekerUserId });
		await integrationDb.seedUser({ id: outsiderUserId });
		await integrationDb.seedHousehold({
			id: sharerHouseholdId,
			members: [{ userId: sharerUserId, role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: seekerHouseholdId,
			members: [{ userId: seekerUserId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function enableNearby(userId: string, householdId: string, coordinate = STOCKHOLM) {
		await integrationDb.db
			.update(userTable)
			.set({
				activeHouseholdId: householdId,
				nearbySharingEnabled: true,
				nearbySharingLat: String(coordinate.latitude),
				nearbySharingLng: String(coordinate.longitude)
			})
			.where(eq(userTable.id, userId));
	}

	async function seedShare(shareId = 'share-market-chat') {
		const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
		const snapshot = {
			items: [
				{
					name: 'Mjölk',
					expiresOn: expiresAt.toISOString().slice(0, 10),
					location: 'fridge' as const,
					quantity: '1',
					unit: null
				}
			],
			createdAt: new Date().toISOString()
		};

		await integrationDb.db.insert(expiringShareLinkTable).values({
			id: shareId,
			householdId: sharerHouseholdId,
			createdByUserId: sharerUserId,
			tokenHash: hashSecureToken(`share-${shareId}`),
			snapshotJson: JSON.stringify(snapshot),
			expiresAt,
			latitude: String(NEARBY.latitude),
			longitude: String(NEARBY.longitude),
			source: 'manual',
			createdAt: new Date()
		});

		return shareId;
	}

	it('creates a thread for an active nearby share', async () => {
		await enableNearby(seekerUserId, seekerHouseholdId);
		await enableNearby(sharerUserId, sharerHouseholdId);
		const shareId = await seedShare();

		const result = await service.createOrGetThread({
			shareId,
			seekerUserId,
			seekerHouseholdId
		});

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.data.created).toBe(true);
		expect(result.data.thread.shareId).toBe(shareId);
		expect(result.data.thread.seekerUserId).toBe(seekerUserId);
		expect(result.data.thread.sharerUserId).toBe(sharerUserId);
	});

	it('denies thread access to unrelated users', async () => {
		await enableNearby(seekerUserId, seekerHouseholdId);
		await enableNearby(sharerUserId, sharerHouseholdId);
		const shareId = await seedShare();

		const created = await service.createOrGetThread({
			shareId,
			seekerUserId,
			seekerHouseholdId
		});
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}

		const denied = await service.getThread(created.data.thread.id, outsiderUserId);
		expect(denied).toEqual({ ok: false, error: 'forbidden' });
	});

	it('rejects duplicate ratings from the same rater', async () => {
		await enableNearby(seekerUserId, seekerHouseholdId);
		await enableNearby(sharerUserId, sharerHouseholdId);
		const shareId = await seedShare();

		const created = await service.createOrGetThread({
			shareId,
			seekerUserId,
			seekerHouseholdId
		});
		expect(created.ok).toBe(true);
		if (!created.ok) {
			return;
		}

		const first = await service.rateThread({
			threadId: created.data.thread.id,
			userId: seekerUserId,
			stars: 5,
			householdId: seekerHouseholdId
		});
		expect(first.ok).toBe(true);

		const second = await service.rateThread({
			threadId: created.data.thread.id,
			userId: seekerUserId,
			stars: 4,
			householdId: seekerHouseholdId
		});
		expect(second).toEqual({ ok: false, error: 'conflict' });
	});

	it('blocks thread creation when seeker blocked the share household', async () => {
		await enableNearby(seekerUserId, seekerHouseholdId);
		await enableNearby(sharerUserId, sharerHouseholdId);
		const shareId = await seedShare();

		await integrationDb.db.insert(expiringShareBlockTable).values({
			id: 'block-household',
			reporterUserId: seekerUserId,
			shareId: null,
			householdId: sharerHouseholdId,
			createdAt: new Date()
		});

		const result = await service.createOrGetThread({
			shareId,
			seekerUserId,
			seekerHouseholdId
		});

		expect(result).toEqual({ ok: false, error: 'blocked' });
	});
});
