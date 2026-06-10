import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { coarseGeoCoordinate } from '$lib/domain/geo';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { ExpiringShareService } from './expiring-share.service';

const STOCKHOLM = { latitude: 59.329323, longitude: 18.068581 };
const NEARBY = { latitude: 59.332, longitude: 18.072 };
const FAR_AWAY = { latitude: 59.4, longitude: 18.2 };

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
		lastConfirmedAt: now,
		createdAt: now,
		updatedAt: now
	};
}

describe('ExpiringShareService — nearby sharing', () => {
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

	async function seedHouseholdPair() {
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

	it('coarsens coordinates when user opts in', async () => {
		await integrationDb.seedUser({ id: 'user-1' });

		const settings = await service.updateNearbySharingSettings('user-1', {
			enabled: true,
			coordinate: STOCKHOLM
		});

		expect(settings.enabled).toBe(true);
		expect(settings.latitude).toBe(coarseGeoCoordinate(STOCKHOLM).latitude);
		expect(settings.longitude).toBe(coarseGeoCoordinate(STOCKHOLM).longitude);
	});

	it('createShareLink attaches geo when opted in and attachNearby is true', async () => {
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});

		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});

		const share = await service.createShareLink(
			'sharer-household',
			'sharer-user',
			[expiringItem('Mjölk')],
			{ attachNearby: true }
		);

		expect(share).not.toBeNull();
		const bounds = await repository.findActiveSharesInBoundingBox(
			{
				minLat: 59,
				maxLat: 60,
				minLng: 18,
				maxLng: 19
			},
			'other-household'
		);
		expect(bounds).toHaveLength(1);
		expect(Number(bounds[0]?.latitude)).toBe(coarseGeoCoordinate(STOCKHOLM).latitude);
		expect(Number(bounds[0]?.longitude)).toBe(coarseGeoCoordinate(STOCKHOLM).longitude);
	});

	it('createShareLink uses explicit coordinate over stored settings', async () => {
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});

		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});

		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Ost')], {
			attachNearby: true,
			coordinate: NEARBY
		});

		const rows = await repository.findActiveSharesInBoundingBox(
			{ minLat: 59, maxLat: 60, minLng: 18, maxLng: 19 },
			'other-household'
		);
		expect(rows).toHaveLength(1);
		expect(Number(rows[0]?.latitude)).toBe(NEARBY.latitude);
		expect(Number(rows[0]?.longitude)).toBe(NEARBY.longitude);
	});

	it('createShareLink skips geo when attachNearby is false', async () => {
		await integrationDb.seedUser({ id: 'sharer-user' });
		await integrationDb.seedHousehold({
			id: 'sharer-household',
			members: [{ userId: 'sharer-user', role: 'owner' }]
		});

		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});

		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Bröd')], {
			attachNearby: false
		});

		const rows = await repository.findActiveSharesInBoundingBox(
			{ minLat: 59, maxLat: 60, minLng: 18, maxLng: 19 },
			'other-household'
		);
		expect(rows).toHaveLength(0);
	});

	it('listNearbyShares returns shares within 500 m', async () => {
		await seedHouseholdPair();

		await service.updateNearbySharingSettings('viewer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: NEARBY
		});

		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Yoghurt')], {
			attachNearby: true,
			coordinate: NEARBY
		});

		const result = await service.listNearbyShares('viewer-user', 'viewer-household');

		expect(result.optedIn).toBe(true);
		expect(result.shares).toHaveLength(1);
		expect(result.shares[0]?.itemCount).toBe(1);
		expect(result.shares[0]?.previewItems[0]?.name).toBe('Yoghurt');
		expect(result.shares[0]?.approximateDistanceM).toBeGreaterThanOrEqual(100);
	});

	it('listNearbyShares excludes shares outside radius', async () => {
		await seedHouseholdPair();

		await service.updateNearbySharingSettings('viewer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: FAR_AWAY
		});

		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Far cheese')], {
			attachNearby: true,
			coordinate: FAR_AWAY
		});

		const result = await service.listNearbyShares('viewer-user', 'viewer-household');

		expect(result.optedIn).toBe(true);
		expect(result.shares).toHaveLength(0);
	});

	it('listNearbyShares returns jittered map coordinates and open path', async () => {
		await seedHouseholdPair();

		await service.updateNearbySharingSettings('viewer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: NEARBY
		});

		const created = await service.createShareLink(
			'sharer-household',
			'sharer-user',
			[expiringItem('Map test')],
			{ attachNearby: true, coordinate: NEARBY }
		);
		expect(created).not.toBeNull();

		const result = await service.listNearbyShares('viewer-user', 'viewer-household');
		expect(result.shares).toHaveLength(1);
		const share = result.shares[0]!;
		expect(share.mapLat).not.toBe(NEARBY.latitude);
		expect(share.mapLng).not.toBe(NEARBY.longitude);
		expect(share.openPath).toBe(`/grannskafferiet/share/${share.id}`);
	});

	it('reportShare blocks share for reporter and hides it from nearby list', async () => {
		await seedHouseholdPair();

		await service.updateNearbySharingSettings('viewer-user', {
			enabled: true,
			coordinate: STOCKHOLM
		});
		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: NEARBY
		});

		const created = await service.createShareLink(
			'sharer-household',
			'sharer-user',
			[expiringItem('Report me')],
			{ attachNearby: true, coordinate: NEARBY }
		);
		expect(created).not.toBeNull();

		const before = await service.listNearbyShares('viewer-user', 'viewer-household');
		expect(before.shares).toHaveLength(1);

		const report = await service.reportShare('viewer-user', {
			shareId: before.shares[0]!.id,
			blockHousehold: true
		});
		expect(report.ok).toBe(true);

		const after = await service.listNearbyShares('viewer-user', 'viewer-household');
		expect(after.shares).toHaveLength(0);
	});

	it('listNearbyShares returns empty when viewer is not opted in', async () => {
		await seedHouseholdPair();

		await service.updateNearbySharingSettings('sharer-user', {
			enabled: true,
			coordinate: NEARBY
		});
		await service.createShareLink('sharer-household', 'sharer-user', [expiringItem('Hidden')], {
			attachNearby: true,
			coordinate: NEARBY
		});

		const result = await service.listNearbyShares('viewer-user', 'viewer-household');

		expect(result.optedIn).toBe(false);
		expect(result.shares).toEqual([]);
	});
});
