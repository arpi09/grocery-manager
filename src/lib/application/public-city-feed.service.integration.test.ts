import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { PublicCityFeedService } from './public-city-feed.service';

const STOCKHOLM_NEARBY = { latitude: 59.332, longitude: 18.072 };
const MALMO_NEARBY = { latitude: 55.605, longitude: 13.004 };

function expiringSnapshot(name: string) {
	return {
		items: [
			{
				name,
				expiresOn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
				location: 'fridge' as const,
				quantity: '1',
				unit: null
			}
		],
		createdAt: new Date().toISOString()
	};
}

describe('PublicCityFeedService', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleExpiringShareRepository;
	let service: PublicCityFeedService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleExpiringShareRepository(integrationDb.db);
		service = new PublicCityFeedService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedHousehold(id: string, userId: string) {
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id,
			members: [{ userId, role: 'owner' }]
		});
	}

	async function seedShare(input: {
		id: string;
		householdId: string;
		userId: string;
		name: string;
		latitude?: number;
		longitude?: number;
		expiresAt?: Date;
	}) {
		await repository.create({
			id: input.id,
			householdId: input.householdId,
			createdByUserId: input.userId,
			tokenHash: `hash-${input.id}`,
			snapshot: expiringSnapshot(input.name),
			expiresAt: input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
			latitude: input.latitude ?? null,
			longitude: input.longitude ?? null
		});
	}

	it('returns shares inside the city bbox and excludes shares outside it', async () => {
		await seedHousehold('household-a', 'user-a');
		await seedHousehold('household-b', 'user-b');

		await seedShare({
			id: 'share-stockholm',
			householdId: 'household-a',
			userId: 'user-a',
			name: 'Stockholm yoghurt',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude
		});
		await seedShare({
			id: 'share-malmo',
			householdId: 'household-b',
			userId: 'user-b',
			name: 'Malmö bread',
			latitude: MALMO_NEARBY.latitude,
			longitude: MALMO_NEARBY.longitude
		});

		const stockholmFeed = await service.getCityFeed('stockholm', { minSupply: 1 });
		const malmoFeed = await service.getCityFeed('malmo', { minSupply: 1 });

		expect(stockholmFeed.hasSupply).toBe(true);
		expect(stockholmFeed.items.map((item) => item.id)).toEqual(['share-stockholm']);
		expect(malmoFeed.hasSupply).toBe(true);
		expect(malmoFeed.items.map((item) => item.id)).toEqual(['share-malmo']);
	});

	it('excludes expired geo shares', async () => {
		await seedHousehold('household-a', 'user-a');

		await seedShare({
			id: 'share-expired',
			householdId: 'household-a',
			userId: 'user-a',
			name: 'Expired bread',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude,
			expiresAt: new Date(Date.now() - 60 * 1000)
		});
		await seedShare({
			id: 'share-active',
			householdId: 'household-a',
			userId: 'user-a',
			name: 'Active milk',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude
		});

		const feed = await service.getCityFeed('stockholm', { minSupply: 1 });

		expect(feed.items.map((item) => item.id)).toEqual(['share-active']);
	});

	it('returns soft landing when supply is below the minimum threshold', async () => {
		await seedHousehold('household-a', 'user-a');
		await seedHousehold('household-b', 'user-b');

		await seedShare({
			id: 'share-1',
			householdId: 'household-a',
			userId: 'user-a',
			name: 'Item one',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude
		});
		await seedShare({
			id: 'share-2',
			householdId: 'household-b',
			userId: 'user-b',
			name: 'Item two',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude
		});

		const feed = await service.getCityFeed('stockholm', { minSupply: 3 });

		expect(feed.hasSupply).toBe(false);
		expect(feed.items).toEqual([]);
		expect(feed.city.slug).toBe('stockholm');
	});

	it('does not expose householdId or coordinates in feed items', async () => {
		await seedHousehold('household-a', 'user-a');

		await seedShare({
			id: 'share-1',
			householdId: 'household-a',
			userId: 'user-a',
			name: 'Private-safe item',
			latitude: STOCKHOLM_NEARBY.latitude,
			longitude: STOCKHOLM_NEARBY.longitude
		});

		const feed = await service.getCityFeed('stockholm', { minSupply: 1 });
		const serialized = JSON.stringify(feed);

		expect(serialized).not.toContain('household-a');
		expect(serialized).not.toContain('householdId');
		expect(serialized).not.toContain(String(STOCKHOLM_NEARBY.latitude));
		expect(serialized).not.toContain(String(STOCKHOLM_NEARBY.longitude));
		expect(serialized).not.toContain('latitude');
		expect(serialized).not.toContain('longitude');
	});
});
