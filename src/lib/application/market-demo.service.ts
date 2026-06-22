import { inArray, like } from 'drizzle-orm';
import {
	isMarketDemoSeedEnabled,
	MARKET_DEMO_DEFAULT_CENTER,
	MARKET_DEMO_HOUSEHOLD_PREFIX,
	MARKET_DEMO_SOURCE,
	MARKET_DEMO_USER_PREFIX,
	marketDemoListingFixtures,
	marketDemoShareExpiresAt
} from '$lib/domain/market-demo';
import { isValidLatitude, isValidLongitude } from '$lib/domain/geo';
import { hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import {
	expiringShareLinkTable,
	householdMemberTable,
	householdTable,
	userTable
} from '$lib/infrastructure/db/schema';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';

export type MarketDemoSeedResult =
	| {
			ok: true;
			listingCount: number;
			center: { latitude: number; longitude: number };
			enabledNearbyForAdmin: boolean;
	  }
	| { ok: false; error: 'disabled' };

export type MarketDemoClearResult = {
	ok: true;
	deletedShares: number;
	deletedHouseholds: number;
	deletedUsers: number;
};

type EnvReader = () => string | undefined;

export class MarketDemoService {
	constructor(
		private readonly expiringShareRepository: IExpiringShareRepository,
		private readonly database: AppDatabase = defaultDb,
		private readonly readDemoSeedEnv: EnvReader = () => undefined
	) {}

	async seedForAdmin(adminUserId: string): Promise<MarketDemoSeedResult> {
		if (!isMarketDemoSeedEnabled(this.readDemoSeedEnv)) {
			return { ok: false, error: 'disabled' };
		}

		await this.clear();

		const settings = await this.expiringShareRepository.getNearbySharingSettings(adminUserId);
		let center = MARKET_DEMO_DEFAULT_CENTER;
		if (
			settings.latitude != null &&
			settings.longitude != null &&
			isValidLatitude(settings.latitude) &&
			isValidLongitude(settings.longitude)
		) {
			center = { latitude: settings.latitude, longitude: settings.longitude };
		}

		let enabledNearbyForAdmin = settings.enabled;
		if (!settings.enabled) {
			await this.expiringShareRepository.updateNearbySharingSettings(adminUserId, {
				enabled: true,
				latitude: center.latitude,
				longitude: center.longitude
			});
			enabledNearbyForAdmin = true;
		} else if (settings.latitude == null || settings.longitude == null) {
			await this.expiringShareRepository.updateNearbySharingSettings(adminUserId, {
				enabled: true,
				latitude: center.latitude,
				longitude: center.longitude
			});
		}

		const fixtures = marketDemoListingFixtures(center);
		const now = new Date();
		const expiresAt = marketDemoShareExpiresAt();

		for (const fixture of fixtures) {
			await this.database.insert(userTable).values({
				id: fixture.userId,
				email: fixture.email,
				passwordHash: null,
				role: 'user',
				displayName: fixture.sharerFirstName,
				marketFirstName: fixture.sharerFirstName,
				createdAt: now
			});

			await this.database.insert(householdTable).values({
				id: fixture.householdId,
				name: `Demo — ${fixture.sharerFirstName}`,
				createdAt: now
			});

			await this.database.insert(householdMemberTable).values({
				householdId: fixture.householdId,
				userId: fixture.userId,
				role: 'owner'
			});

			await this.expiringShareRepository.create({
				id: fixture.shareId,
				householdId: fixture.householdId,
				createdByUserId: fixture.userId,
				tokenHash: hashSecureToken(`demo_market:${fixture.shareId}`),
				snapshot: {
					items: fixture.items,
					createdAt: now.toISOString()
				},
				expiresAt,
				latitude: fixture.latitude,
				longitude: fixture.longitude,
				source: MARKET_DEMO_SOURCE
			});
		}

		return {
			ok: true,
			listingCount: fixtures.length,
			center,
			enabledNearbyForAdmin
		};
	}

	async clear(): Promise<MarketDemoClearResult> {
		const demoShareIds = await this.database
			.select({ id: expiringShareLinkTable.id })
			.from(expiringShareLinkTable)
			.where(inArray(expiringShareLinkTable.source, [MARKET_DEMO_SOURCE]));

		const deletedShares = demoShareIds.length;
		if (deletedShares > 0) {
			await this.database
				.delete(expiringShareLinkTable)
				.where(inArray(expiringShareLinkTable.id, demoShareIds.map((row) => row.id)));
		}

		const demoHouseholds = await this.database
			.select({ id: householdTable.id })
			.from(householdTable)
			.where(like(householdTable.id, `${MARKET_DEMO_HOUSEHOLD_PREFIX}%`));

		const deletedHouseholds = demoHouseholds.length;
		if (deletedHouseholds > 0) {
			await this.database
				.delete(householdTable)
				.where(inArray(householdTable.id, demoHouseholds.map((row) => row.id)));
		}

		const demoUsers = await this.database
			.select({ id: userTable.id })
			.from(userTable)
			.where(like(userTable.id, `${MARKET_DEMO_USER_PREFIX}%`));

		const deletedUsers = demoUsers.length;
		if (deletedUsers > 0) {
			await this.database
				.delete(userTable)
				.where(inArray(userTable.id, demoUsers.map((row) => row.id)));
		}

		return {
			ok: true,
			deletedShares,
			deletedHouseholds,
			deletedUsers
		};
	}

	async countActiveDemoListings(): Promise<number> {
		const rows = await this.database
			.select({ expiresAt: expiringShareLinkTable.expiresAt })
			.from(expiringShareLinkTable)
			.where(
				inArray(expiringShareLinkTable.source, [MARKET_DEMO_SOURCE])
			);
		const now = Date.now();
		return rows.filter((row) => row.expiresAt.getTime() > now).length;
	}
}
