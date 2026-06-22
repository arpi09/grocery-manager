import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExpiringShareService } from '$lib/application/expiring-share.service';
import { MarketDemoService } from '$lib/application/market-demo.service';
import {
	MARKET_DEMO_HOUSEHOLD_PREFIX,
	MARKET_DEMO_SHARE_PREFIX,
	MARKET_DEMO_USER_PREFIX
} from '$lib/domain/market-demo';
import { DrizzleExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const STOCKHOLM = { latitude: 59.329323, longitude: 18.068581 };

describe('MarketDemoService (integration)', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzleExpiringShareRepository;
	let demoService: MarketDemoService;
	let expiringShareService: ExpiringShareService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleExpiringShareRepository(integrationDb.db);
		demoService = new MarketDemoService(repository, integrationDb.db);
		expiringShareService = new ExpiringShareService(repository);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('seeds four nearby-visible listings and clears them idempotently', async () => {
		await integrationDb.seedUser({ id: 'admin-demo', email: 'admin-demo@example.com' });
		await integrationDb.seedHousehold({
			id: 'admin-hh',
			members: [{ userId: 'admin-demo', role: 'owner' }]
		});

		await expiringShareService.updateNearbySharingSettings('admin-demo', {
			enabled: true,
			coordinate: STOCKHOLM
		});

		const seed = await demoService.seedForAdmin('admin-demo');
		expect(seed.ok).toBe(true);
		if (!seed.ok) {
			return;
		}
		expect(seed.listingCount).toBe(4);
		expect(seed.chatThreadCount).toBe(4);

		const nearby = await expiringShareService.listNearbyShares('admin-demo', 'admin-hh');
		expect(nearby.shares.length).toBe(4);

		const cleared = await demoService.clear();
		expect(cleared.deletedShares).toBe(4);
		expect(cleared.deletedThreads).toBe(4);
		expect(cleared.deletedHouseholds).toBe(4);
		expect(cleared.deletedUsers).toBe(4);

		const nearbyAfter = await expiringShareService.listNearbyShares('admin-demo', 'admin-hh');
		expect(nearbyAfter.shares.length).toBe(0);
	});

	it('uses stable demo id prefixes', async () => {
		await integrationDb.seedUser({ id: 'admin-demo', email: 'admin-demo@example.com' });
		await demoService.seedForAdmin('admin-demo');
		expect(await demoService.countActiveDemoListings()).toBe(4);

		const clear = await demoService.clear();
		expect(clear.deletedShares).toBe(4);
		expect(`${MARKET_DEMO_USER_PREFIX}1`.startsWith(MARKET_DEMO_USER_PREFIX)).toBe(true);
		expect(`${MARKET_DEMO_HOUSEHOLD_PREFIX}1`.startsWith(MARKET_DEMO_HOUSEHOLD_PREFIX)).toBe(true);
		expect(`${MARKET_DEMO_SHARE_PREFIX}1`.startsWith(MARKET_DEMO_SHARE_PREFIX)).toBe(true);
	});
});
