import { eq, inArray, like } from 'drizzle-orm';
import {
	isMarketDemoSeedEnabled,
	MARKET_DEMO_DEFAULT_CENTER,
	MARKET_DEMO_HOUSEHOLD_PREFIX,
	MARKET_DEMO_SOURCE,
	MARKET_DEMO_THREAD_PREFIX,
	MARKET_DEMO_USER_PREFIX,
	marketDemoChatFixtures,
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
	marketChatMessageTable,
	marketChatReportTable,
	marketChatThreadTable,
	marketExchangeRatingTable,
	userTable
} from '$lib/infrastructure/db/schema';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';

export type MarketDemoSeedResult =
	| {
			ok: true;
			listingCount: number;
			chatThreadCount: number;
			center: { latitude: number; longitude: number };
			enabledNearbyForAdmin: boolean;
	  }
	| { ok: false; error: 'disabled' };

export type MarketDemoClearResult = {
	ok: true;
	deletedShares: number;
	deletedThreads: number;
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

		const chatFixtures = marketDemoChatFixtures(adminUserId, fixtures);
		for (const chatFixture of chatFixtures) {
			const threadCreatedAt = new Date(now.getTime() + chatFixture.messages[0]!.offsetMinutes * 60_000);
			const lifecycleStatus = chatFixture.lifecycleStatus ?? 'chatting';
			const isCompleted = lifecycleStatus === 'completed';
			const isReported = lifecycleStatus === 'reported';
			const closedAt =
				isCompleted || isReported ? new Date(now.getTime() - 30 * 60_000) : null;

			await this.database.insert(marketChatThreadTable).values({
				id: chatFixture.threadId,
				shareId: chatFixture.shareId,
				seekerUserId: adminUserId,
				sharerUserId: chatFixture.sharerUserId,
				householdId: chatFixture.householdId,
				lifecycleStatus,
				...(chatFixture.lifecycleStatus === 'pickup_agreed'
					? { pickupAgreedAt: new Date(now.getTime() - 60 * 60_000) }
					: {}),
				...(isCompleted
					? {
							exchangeStatus: 'completed' as const,
							seekerCompletedAt: closedAt,
							sharerCompletedAt: closedAt,
							closedAt
						}
					: {}),
				...(isReported ? { closedAt } : {}),
				createdAt: threadCreatedAt
			});

			for (const [index, message] of chatFixture.messages.entries()) {
				const createdAt = new Date(now.getTime() + message.offsetMinutes * 60_000);
				const authorUserId = message.author === 'admin' ? adminUserId : chatFixture.sharerUserId;
				await this.database.insert(marketChatMessageTable).values({
					id: `${chatFixture.threadId}-msg-${index + 1}`,
					threadId: chatFixture.threadId,
					authorUserId,
					body: message.body,
					createdAt
				});
			}

			if (chatFixture.reportReason) {
				await this.database.insert(marketChatReportTable).values({
					id: `${chatFixture.threadId}-report`,
					threadId: chatFixture.threadId,
					reporterUserId: adminUserId,
					reason: chatFixture.reportReason,
					createdAt: closedAt ?? now
				});
			}

			if (chatFixture.adminRating) {
				const completedAt = closedAt ?? new Date(now.getTime() - 30 * 60_000);
				const revealedAt = chatFixture.sharerRating ? completedAt : null;

				await this.database.insert(marketExchangeRatingTable).values({
					id: `${chatFixture.threadId}-rating-admin`,
					threadId: chatFixture.threadId,
					raterUserId: adminUserId,
					ratedUserId: chatFixture.sharerUserId,
					stars: chatFixture.adminRating.stars,
					comment: chatFixture.adminRating.comment ?? null,
					itemsAsDescribed: chatFixture.adminRating.itemsAsDescribed ?? null,
					revealedAt,
					createdAt: completedAt
				});
			}

			if (chatFixture.sharerRating) {
				const completedAt = closedAt ?? new Date(now.getTime() - 30 * 60_000);
				await this.database.insert(marketExchangeRatingTable).values({
					id: `${chatFixture.threadId}-rating-sharer`,
					threadId: chatFixture.threadId,
					raterUserId: chatFixture.sharerUserId,
					ratedUserId: adminUserId,
					stars: chatFixture.sharerRating.stars,
					comment: chatFixture.sharerRating.comment ?? null,
					itemsAsDescribed: chatFixture.sharerRating.itemsAsDescribed ?? null,
					revealedAt: completedAt,
					createdAt: completedAt
				});

				if (chatFixture.adminRating) {
					await this.database
						.update(marketExchangeRatingTable)
						.set({ revealedAt: completedAt })
						.where(eq(marketExchangeRatingTable.threadId, chatFixture.threadId));
				}
			}
		}

		return {
			ok: true,
			listingCount: fixtures.length,
			chatThreadCount: chatFixtures.length,
			center,
			enabledNearbyForAdmin
		};
	}

	async clear(): Promise<MarketDemoClearResult> {
		const demoThreadIds = await this.database
			.select({ id: marketChatThreadTable.id })
			.from(marketChatThreadTable)
			.where(like(marketChatThreadTable.id, `${MARKET_DEMO_THREAD_PREFIX}%`));

		const deletedThreads = demoThreadIds.length;
		if (deletedThreads > 0) {
			await this.database
				.delete(marketChatThreadTable)
				.where(inArray(marketChatThreadTable.id, demoThreadIds.map((row) => row.id)));
		}

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
			deletedThreads,
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
