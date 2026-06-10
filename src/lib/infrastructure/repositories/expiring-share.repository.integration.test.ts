import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { geoBoundingBox, NEARBY_SHARING_RADIUS_M } from '$lib/domain/geo';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleExpiringShareRepository } from './expiring-share.repository';

const STOCKHOLM = { latitude: 59.329, longitude: 18.069 };
const NEARBY = { latitude: 59.332, longitude: 18.072 };
const FAR_AWAY = { latitude: 59.4, longitude: 18.2 };

function expiringSnapshot(name = 'Mjölk') {
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

describe('DrizzleExpiringShareRepository — nearby sharing', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleExpiringShareRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleExpiringShareRepository(integrationDb.db);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedUsersAndHouseholds() {
		await integrationDb.seedUser({ id: 'viewer-user' });
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'viewer-household',
			members: [{ userId: 'viewer-user', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});
	}

	it('returns default nearby settings for a new user', async () => {
		await integrationDb.seedUser({ id: 'user-1' });

		const settings = await repository.getNearbySharingSettings('user-1');

		expect(settings).toEqual({
			enabled: false,
			latitude: null,
			longitude: null,
			updatedAt: null
		});
	});

	it('persists opt-in with coarse coordinates', async () => {
		await integrationDb.seedUser({ id: 'user-1' });

		await repository.updateNearbySharingSettings('user-1', {
			enabled: true,
			latitude: 59.329,
			longitude: 18.069
		});

		const settings = await repository.getNearbySharingSettings('user-1');
		expect(settings.enabled).toBe(true);
		expect(settings.latitude).toBe(59.329);
		expect(settings.longitude).toBe(18.069);
		expect(settings.updatedAt).toBeInstanceOf(Date);
	});

	it('clears coordinates on opt-out', async () => {
		await integrationDb.seedUser({ id: 'user-1' });

		await repository.updateNearbySharingSettings('user-1', {
			enabled: true,
			latitude: 59.329,
			longitude: 18.069
		});
		await repository.updateNearbySharingSettings('user-1', {
			enabled: false,
			latitude: null,
			longitude: null
		});

		const settings = await repository.getNearbySharingSettings('user-1');
		expect(settings.enabled).toBe(false);
		expect(settings.latitude).toBeNull();
		expect(settings.longitude).toBeNull();
	});

	it('findActiveSharesInBoundingBox returns geo-tagged shares within bounds', async () => {
		await seedUsersAndHouseholds();

		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
		await repository.create({
			id: 'share-nearby',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			tokenHash: 'hash-nearby',
			snapshot: expiringSnapshot('Nearby yoghurt'),
			expiresAt,
			latitude: NEARBY.latitude,
			longitude: NEARBY.longitude
		});
		await repository.create({
			id: 'share-far',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			tokenHash: 'hash-far',
			snapshot: expiringSnapshot('Far away cheese'),
			expiresAt,
			latitude: FAR_AWAY.latitude,
			longitude: FAR_AWAY.longitude
		});
		await repository.create({
			id: 'share-no-geo',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			tokenHash: 'hash-no-geo',
			snapshot: expiringSnapshot('No geo milk'),
			expiresAt
		});

		const bounds = geoBoundingBox(STOCKHOLM, NEARBY_SHARING_RADIUS_M);
		const rows = await repository.findActiveSharesInBoundingBox(bounds, 'viewer-household');

		expect(rows.map((row) => row.id)).toEqual(['share-nearby']);
	});

	it('findActiveSharesInBoundingBox excludes viewer household shares', async () => {
		await seedUsersAndHouseholds();

		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
		await repository.create({
			id: 'share-own',
			householdId: 'viewer-household',
			createdByUserId: 'viewer-user',
			tokenHash: 'hash-own',
			snapshot: expiringSnapshot('Own item'),
			expiresAt,
			latitude: NEARBY.latitude,
			longitude: NEARBY.longitude
		});

		const bounds = geoBoundingBox(STOCKHOLM, NEARBY_SHARING_RADIUS_M);
		const rows = await repository.findActiveSharesInBoundingBox(bounds, 'viewer-household');

		expect(rows).toHaveLength(0);
	});

	it('findActiveSharesInBoundingBox excludes expired shares', async () => {
		await seedUsersAndHouseholds();

		await repository.create({
			id: 'share-expired',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			tokenHash: 'hash-expired',
			snapshot: expiringSnapshot('Expired bread'),
			expiresAt: new Date(Date.now() - 60 * 1000),
			latitude: NEARBY.latitude,
			longitude: NEARBY.longitude
		});

		const bounds = geoBoundingBox(STOCKHOLM, NEARBY_SHARING_RADIUS_M);
		const rows = await repository.findActiveSharesInBoundingBox(bounds, 'viewer-household');

		expect(rows).toHaveLength(0);
	});
});
