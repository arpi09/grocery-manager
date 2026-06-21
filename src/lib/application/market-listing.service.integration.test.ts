import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { MarketListingService } from './market-listing.service';
import { ExpiringShareService } from './expiring-share.service';
import { InventoryService } from './inventory.service';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleUserRepository } from '$lib/infrastructure/repositories/user.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { HouseholdService } from '$lib/application/household.service';
import { BillingService } from '$lib/application/billing.service';
import { PmfService } from '$lib/application/pmf.service';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzleBillingRepository } from '$lib/infrastructure/repositories/billing.repository';
import { expiringShareLinkTable, inventoryItemTable, userTable } from '$lib/infrastructure/db/schema';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

vi.mock('$lib/server/shelf-life-inference', () => ({ inferShelfLife: vi.fn(async () => null) }));

describe('MarketListingService — auto_nearby listing', () => {
	let integrationDb: IntegrationDbContext;
	let service: MarketListingService;
	let expiringShareRepository: DrizzleExpiringShareRepository;

	const userId = 'market-user';
	const householdId = 'market-household';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		expiringShareRepository = new DrizzleExpiringShareRepository(integrationDb.db);
		const expiringShareService = new ExpiringShareService(expiringShareRepository);
		const inventoryService = new InventoryService(new DrizzleInventoryRepository(integrationDb.db));
		const userRepository = new DrizzleUserRepository(integrationDb.db);
		const householdService = new HouseholdService(new DrizzleHouseholdRepository(integrationDb.db));
		const billingService = new BillingService(
			new DrizzleBillingRepository(integrationDb.db),
			{ isCheckoutConfigured: () => false, createClient: vi.fn(), getPriceIdForInterval: () => null },
			{ getOrigin: () => 'https://example.com' },
			{ isStripeCheckoutEnabled: async () => false }
		);
		const pmfService = new PmfService(new DrizzlePmfRepository());

		service = new MarketListingService(
			expiringShareService,
			expiringShareRepository,
			inventoryService,
			userRepository,
			householdService,
			billingService,
			pmfService
		);
	});

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			members: [{ userId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function enableAutoListingWithNearby() {
		await integrationDb.db
			.update(userTable)
			.set({
				autoNearbyListingEnabled: true,
				nearbySharingEnabled: true,
				nearbySharingLat: '59.329323',
				nearbySharingLng: '18.068581'
			})
			.where(eq(userTable.id, userId));
	}

	function expiringOn(daysAhead: number): string {
		const date = new Date();
		date.setDate(date.getDate() + daysAhead);
		return date.toISOString().slice(0, 10);
	}

	it('upserts one active auto_nearby listing when items expire soon', async () => {
		await enableAutoListingWithNearby();
		await integrationDb.db.insert(inventoryItemTable).values({
			id: 'item-milk',
			householdId,
			userId,
			name: 'Mjölk',
			location: 'fridge',
			quantity: '1',
			expiresOn: expiringOn(2)
		});

		const result = await service.refreshAutoNearbyListing(householdId, userId);
		expect(result.status).toBe('published');
		if (result.status !== 'published') {
			return;
		}

		const active = await expiringShareRepository.findActiveAutoNearbyListing(householdId);
		expect(active).not.toBeNull();

		const rows = await integrationDb.db
			.select()
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.householdId, householdId));

		expect(rows).toHaveLength(1);
		expect(rows[0]?.source).toBe('auto_nearby');
		expect(JSON.parse(rows[0]!.snapshotJson).items).toHaveLength(1);

		const second = await service.refreshAutoNearbyListing(householdId, userId);
		expect(second.status).toBe('published');
		const rowsAfter = await integrationDb.db
			.select()
			.from(expiringShareLinkTable)
			.where(eq(expiringShareLinkTable.householdId, householdId));
		expect(rowsAfter).toHaveLength(1);
	});

	it('clears auto_nearby listing when no expiring items remain', async () => {
		await enableAutoListingWithNearby();
		await integrationDb.db.insert(inventoryItemTable).values({
			id: 'item-bread',
			householdId,
			userId,
			name: 'Bröd',
			location: 'cupboard',
			quantity: '1',
			expiresOn: expiringOn(2)
		});

		const published = await service.refreshAutoNearbyListing(householdId, userId);
		expect(published.status).toBe('published');

		await integrationDb.db.delete(inventoryItemTable).where(eq(inventoryItemTable.id, 'item-bread'));

		const cleared = await service.refreshAutoNearbyListing(householdId, userId);
		expect(cleared.status).toBe('cleared');

		const active = await expiringShareRepository.findActiveAutoNearbyListing(householdId);
		expect(active).toBeNull();
	});
});
