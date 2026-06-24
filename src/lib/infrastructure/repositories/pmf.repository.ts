import {
	buildActivationFunnelSnapshot,
	type ActivationFunnelPeriodDays,
	type ActivationFunnelSnapshot
} from '$lib/domain/activation-funnel';
import {
	buildPmfFunnelSnapshot,
	FUNNEL_ACTIVITY_EVENT_TYPES,
	FUNNEL_FIRST_SCAN_EVENT_TYPES,
	type PmfFunnelPeriodDays,
	type PmfFunnelSnapshot
} from '$lib/domain/pmf-funnel';
import {
	buildLaunchCohortSnapshot,
	type LaunchCohortSnapshot
} from '$lib/domain/launch-cohort';
import {
	computeActivationRate,
	computeInviteRate,
	computeMultiMemberHouseholdRate,
	computeReceiptRate,
	computeRetentionRate,
	computeSmartFillWeeklyRate,
	computeWeeklyRitualRate,
	computeWeeklyScanRate,
	computeWrappedRate,
	isUserActivated,
	medianMinutesToFirstScan,
	type PmfMetricSnapshot,
	type PmfProductEventType,
	type ProductEventType,
	MAU_WINDOW_MS,
	WAU_WINDOW_MS
} from '$lib/domain/pmf';
import { SYNC_ANALYTICS_EVENTS } from '$lib/domain/sync-analytics';
import { parseInventoryWriteMetadata, type HouseholdActivityEvent } from '$lib/domain/household-activity';
import type { SyncFunnelCounts } from '$lib/domain/sync-funnel-admin';
import {
	ACQUISITION_CTR_EVENT_TYPE,
	ACQUISITION_WEEKLY_EVENT_TYPES,
	buildAcquisitionMetricsSnapshot,
	emptyAcquisitionEventCounts,
	type AcquisitionEventCounts,
	type AcquisitionMetricsSnapshot
} from '$lib/domain/acquisition-metrics';
import {
	buildMarketV01MetricsSnapshot,
	emptyMarketV01EventCounts,
	MARKET_V01_METRIC_EVENT_TYPES,
	type MarketV01MetricsSnapshot
} from '$lib/domain/market-v01-metrics';
import {
	BRAIN_METRIC_EVENT_TYPES,
	computeTimeToReviewMinutes,
	emptyBrainMetricEventCounts,
	emptyBrainReceiptFunnelCounts,
	modelVersionToExpiresOnSource,
	type BrainMetricEventType,
	type BrainMetricsRawCounts,
	type BrainMetricExpiresOnSource
} from '$lib/domain/brain-metrics-admin';
import { generateId } from '$lib/infrastructure/auth/id';
import { db } from '$lib/infrastructure/db';
import {
	expiringShareLinkTable,
	householdMemberTable,
	householdTable,
	inventoryItemTable,
	learningFeedbackTable,
	productEventTable,
	userTable
} from '$lib/infrastructure/db/schema';
import { and, desc, eq, gte, gt, inArray, sql } from 'drizzle-orm';

export interface RecordProductEventInput {
	userId: string | null;
	householdId: string | null;
	eventType: ProductEventType;
	metadata?: Record<string, unknown>;
}

export interface IPmfRepository {
	recordEvent(input: RecordProductEventInput): Promise<void>;
	getGlobalMetrics(now?: Date): Promise<PmfMetricSnapshot>;
	getFunnelMetrics(periodDays: PmfFunnelPeriodDays, now?: Date): Promise<PmfFunnelSnapshot>;
	getActivationFunnelMetrics(
		periodDays: ActivationFunnelPeriodDays,
		now?: Date
	): Promise<ActivationFunnelSnapshot>;
	getLaunchCohortSignups(periodDays: PmfFunnelPeriodDays, now?: Date): Promise<LaunchCohortSnapshot>;
	hasHouseholdEvent(householdId: string, eventType: ProductEventType): Promise<boolean>;
	countHouseholdEventsSince(
		householdId: string,
		eventType: ProductEventType,
		since: Date
	): Promise<number>;
	countUserScanEvents(userId: string): Promise<number>;
	getUserCreatedAt(userId: string): Promise<Date | null>;
	listRecentHouseholdSyncEvents(householdId: string, limit: number): Promise<HouseholdActivityEvent[]>;
	getSyncFunnelCounts(now?: Date): Promise<SyncFunnelCounts>;
	getAcquisitionMetrics(now?: Date): Promise<AcquisitionMetricsSnapshot>;
	getMarketV01Metrics(now?: Date): Promise<MarketV01MetricsSnapshot>;
	countDistinctHouseholdsWithEventSince(eventType: ProductEventType, since: Date): Promise<number>;
	getBrainMetricsSince(since: Date, now?: Date): Promise<BrainMetricsRawCounts>;
	listBrainTimelineEvents(
		householdId: string,
		since: Date,
		limit: number
	): Promise<
		Array<{
			id: string;
			eventType: string;
			createdAt: Date;
			metadata: Record<string, unknown> | null;
		}>
	>;
}

function userIdsFromEventRows(rows: Array<{ userId: string | null }>): Set<string> {
	return new Set(rows.map((row) => row.userId).filter((id): id is string => id != null));
}

export class DrizzlePmfRepository implements IPmfRepository {
	async recordEvent(input: RecordProductEventInput): Promise<void> {
		await db.insert(productEventTable).values({
			id: generateId(),
			userId: input.userId,
			householdId: input.householdId,
			eventType: input.eventType,
			metadata: input.metadata ? JSON.stringify(input.metadata) : null
		});
	}

	async getGlobalMetrics(now = new Date()): Promise<PmfMetricSnapshot> {
		const wauSince = new Date(now.getTime() - WAU_WINDOW_MS);
		const mauSince = new Date(now.getTime() - MAU_WINDOW_MS);

		const [
			users,
			activationItemRows,
			receiptActivationRows,
			firstScanRows,
			weeklyScanRows,
			weeklyFillRows,
			weeklyRitualRows,
			wrappedViewerRows,
			receiptUserRows,
			newHouseholdRows,
			householdMemberCounts,
			householdMembers,
			eventCountRows
		] = await Promise.all([
				db
					.select({
						id: userTable.id,
						createdAt: userTable.createdAt,
						lastSeenAt: userTable.lastSeenAt
					})
					.from(userTable),
				db
					.select({
						userId: inventoryItemTable.userId,
						count: sql<number>`count(*)::int`
					})
					.from(inventoryItemTable)
					.innerJoin(userTable, eq(inventoryItemTable.userId, userTable.id))
					.where(
						sql`${inventoryItemTable.createdAt} <= ${userTable.createdAt} + interval '24 hours'`
					)
					.groupBy(inventoryItemTable.userId),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.innerJoin(userTable, eq(productEventTable.userId, userTable.id))
					.where(
						and(
							eq(productEventTable.eventType, 'receipt_parsed'),
							sql`${productEventTable.createdAt} <= ${userTable.createdAt} + interval '24 hours'`
						)
					),
				db
					.select({
						userId: productEventTable.userId,
						firstAt: sql<Date>`min(${productEventTable.createdAt})`
					})
					.from(productEventTable)
					.where(inArray(productEventTable.eventType, ['scan_completed', 'receipt_parsed']))
					.groupBy(productEventTable.userId),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.where(
						and(
							inArray(productEventTable.eventType, ['scan_completed', 'receipt_parsed']),
							gte(productEventTable.createdAt, wauSince)
						)
					),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.where(
						and(
							eq(productEventTable.eventType, 'fill_suggestions_added'),
							gte(productEventTable.createdAt, wauSince)
						)
					),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.where(
						and(
							eq(productEventTable.eventType, 'weekly_ritual_approved'),
							gte(productEventTable.createdAt, wauSince)
						)
					),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.where(
						and(
							eq(productEventTable.eventType, 'wrapped_viewed'),
							gte(productEventTable.createdAt, mauSince)
						)
					),
				db
					.selectDistinct({ userId: productEventTable.userId })
					.from(productEventTable)
					.where(eq(productEventTable.eventType, 'receipt_parsed')),
				db
					.select({
						id: householdTable.id,
						createdAt: householdTable.createdAt
					})
					.from(householdTable)
					.where(gte(householdTable.createdAt, wauSince)),
				db
					.select({
						householdId: householdMemberTable.householdId,
						count: sql<number>`count(*)::int`
					})
					.from(householdMemberTable)
					.groupBy(householdMemberTable.householdId),
				db
					.select({
						householdId: householdMemberTable.householdId,
						userId: householdMemberTable.userId,
						lastSeenAt: userTable.lastSeenAt
					})
					.from(householdMemberTable)
					.innerJoin(userTable, eq(householdMemberTable.userId, userTable.id)),
				db
					.select({
						eventType: productEventTable.eventType,
						count: sql<number>`count(*)::int`
					})
					.from(productEventTable)
					.groupBy(productEventTable.eventType)
			]);

		const itemCountByUser = new Map(
			activationItemRows.map((row) => [row.userId, row.count ?? 0])
		);
		const receiptActivatedUsers = new Set(
			receiptActivationRows
				.map((row) => row.userId)
				.filter((id): id is string => id != null)
		);

		const activationFacts = users.map((user) => ({
			userId: user.id,
			registeredAt: user.createdAt,
			itemCountWithin24h: itemCountByUser.get(user.id) ?? 0,
			receiptParsedWithin24h: receiptActivatedUsers.has(user.id)
		}));

		const activation = computeActivationRate(activationFacts);

		const firstScanByUser = new Map(
			firstScanRows
				.filter((row): row is typeof row & { userId: string; firstAt: Date } => row.userId != null)
				.map((row) => [row.userId, row.firstAt])
		);
		const firstScanFacts = users.map((user) => ({
			userId: user.id,
			registeredAt: user.createdAt,
			firstScanAt: firstScanByUser.get(user.id) ?? null
		}));

		const wauUserIds = new Set(
			users
				.filter((user) => user.lastSeenAt && user.lastSeenAt >= wauSince)
				.map((user) => user.id)
		);
		const weeklyScannerUserIds = userIdsFromEventRows(weeklyScanRows);
		const weeklyScan = computeWeeklyScanRate(wauUserIds, weeklyScannerUserIds);

		const d7 = computeRetentionRate(users, 7, now);
		const d30 = computeRetentionRate(users, 30, now);

		const multiMember = computeMultiMemberHouseholdRate(householdMembers, now);
		const smartFill = computeSmartFillWeeklyRate(wauUserIds, userIdsFromEventRows(weeklyFillRows));
		const weeklyRitual = computeWeeklyRitualRate(
			wauUserIds,
			userIdsFromEventRows(weeklyRitualRows)
		);

		const mauUserIds = new Set(
			users
				.filter((user) => user.lastSeenAt && user.lastSeenAt >= mauSince)
				.map((user) => user.id)
		);
		const wrapped = computeWrappedRate(mauUserIds, userIdsFromEventRows(wrappedViewerRows));

		const activatedUserIds = new Set(
			activationFacts.filter(isUserActivated).map((facts) => facts.userId)
		);
		const receipt = computeReceiptRate(activatedUserIds, userIdsFromEventRows(receiptUserRows));

		const memberCountByHousehold = new Map(
			householdMemberCounts.map((row) => [row.householdId, row.count ?? 0])
		);
		const invite = computeInviteRate(
			newHouseholdRows.map((household) => memberCountByHousehold.get(household.id) ?? 0)
		);

		const eventCounts: Record<PmfProductEventType, number> = {
			scan_completed: 0,
			receipt_import_started: 0,
			receipt_uploaded: 0,
			receipt_parsed: 0,
			receipt_review_completed: 0,
			photo_round_parsed: 0,
			fill_suggestions_added: 0
		};

		for (const row of eventCountRows) {
			if (row.eventType in eventCounts) {
				eventCounts[row.eventType as PmfProductEventType] = row.count ?? 0;
			}
		}

		return {
			activationRate: activation.rate,
			activatedUsers: activation.activatedUsers,
			eligibleUsers: activation.eligibleUsers,
			medianTimeToFirstScanMinutes: medianMinutesToFirstScan(firstScanFacts),
			weeklyScanRate: weeklyScan.rate,
			wauCount: weeklyScan.wauCount,
			weeklyScanners: weeklyScan.weeklyScanners,
			d7Retention: d7.rate,
			d7EligibleUsers: d7.eligibleUsers,
			d30Retention: d30.rate,
			d30EligibleUsers: d30.eligibleUsers,
			multiMemberHouseholdRate: multiMember.rate,
			activeHouseholds: multiMember.activeHouseholds,
			multiMemberActiveHouseholds: multiMember.multiMemberActiveHouseholds,
			smartFillWeeklyRate: smartFill.rate,
			weeklyFillUsers: smartFill.weeklyFillUsers,
			weeklyRitualRate: weeklyRitual.rate,
			weeklyRitualUsers: weeklyRitual.weeklyRitualUsers,
			wrappedRate: wrapped.rate,
			mauCount: wrapped.mauCount,
			wrappedViewers: wrapped.wrappedViewers,
			receiptRate: receipt.rate,
			receiptUsers: receipt.receiptUsers,
			inviteRate: invite.rate,
			newHouseholds: invite.newHouseholds,
			multiMemberNewHouseholds: invite.multiMemberNewHouseholds,
			eventCounts
		};
	}

	async getFunnelMetrics(periodDays: PmfFunnelPeriodDays, now = new Date()): Promise<PmfFunnelSnapshot> {
		const periodMs = periodDays * 24 * 60 * 60 * 1000;
		const periodStart = new Date(now.getTime() - periodMs);

		const [
			landingRow,
			signupRow,
			firstScanUserRows,
			proxyUsersRow,
			cohortUsers,
			activityRows
		] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'landing_view'),
						gte(productEventTable.createdAt, periodStart)
					)
				),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'signup_complete'),
						gte(productEventTable.createdAt, periodStart)
					)
				),
			db
				.select({
					userId: productEventTable.userId,
					firstAt: sql<Date>`min(${productEventTable.createdAt})`
				})
				.from(productEventTable)
				.where(
					and(
						sql`${productEventTable.userId} is not null`,
						inArray(productEventTable.eventType, [...FUNNEL_FIRST_SCAN_EVENT_TYPES])
					)
				)
				.groupBy(productEventTable.userId),
			db
				.select({
					count: sql<number>`count(distinct ${productEventTable.userId})::int`
				})
				.from(productEventTable)
				.where(
					and(
						sql`${productEventTable.userId} is not null`,
						gte(productEventTable.createdAt, periodStart)
					)
				),
			db
				.select({
					id: userTable.id,
					createdAt: userTable.createdAt
				})
				.from(userTable)
				.where(gte(userTable.createdAt, periodStart)),
			db
				.select({
					userId: productEventTable.userId,
					createdAt: productEventTable.createdAt
				})
				.from(productEventTable)
				.innerJoin(userTable, eq(productEventTable.userId, userTable.id))
				.where(
					and(
						gte(userTable.createdAt, periodStart),
						inArray(productEventTable.eventType, [...FUNNEL_ACTIVITY_EVENT_TYPES])
					)
				)
		]);

		const activity = activityRows
			.filter((row): row is { userId: string; createdAt: Date } => row.userId != null)
			.map((row) => ({ userId: row.userId, createdAt: row.createdAt }));

		const periodStartMs = periodStart.getTime();
		const firstScans = firstScanUserRows.filter((row) => {
			if (row.userId == null || !row.firstAt) {
				return false;
			}
			const firstAtMs =
				row.firstAt instanceof Date ? row.firstAt.getTime() : new Date(row.firstAt).getTime();
			return firstAtMs >= periodStartMs;
		}).length;

		return buildPmfFunnelSnapshot({
			periodDays,
			periodStart,
			periodEnd: now,
			landingViews: landingRow[0]?.count ?? 0,
			uniqueActiveUsersInPeriod: proxyUsersRow[0]?.count ?? 0,
			signups: signupRow[0]?.count ?? 0,
			firstScans,
			users: cohortUsers.map((user) => ({ userId: user.id, registeredAt: user.createdAt })),
			activityRows: activity
		});
	}

	async getActivationFunnelMetrics(
		periodDays: ActivationFunnelPeriodDays,
		now = new Date()
	): Promise<ActivationFunnelSnapshot> {
		const periodMs = periodDays * 24 * 60 * 60 * 1000;
		const periodStart = new Date(now.getTime() - periodMs);

		const [
			cohortUsers,
			onboardingRows,
			receiptParsed24hRows,
			inventoryFiveRows,
			activationRecipesRows,
			sharedListRow
		] = await Promise.all([
			db
				.select({
					id: userTable.id,
					createdAt: userTable.createdAt,
					lastSeenAt: userTable.lastSeenAt
				})
				.from(userTable)
				.where(gte(userTable.createdAt, periodStart)),
			db
				.selectDistinct({ userId: productEventTable.userId })
				.from(productEventTable)
				.innerJoin(userTable, eq(productEventTable.userId, userTable.id))
				.where(
					and(
						gte(userTable.createdAt, periodStart),
						eq(productEventTable.eventType, 'onboarding_started')
					)
				),
			db
				.selectDistinct({ userId: productEventTable.userId })
				.from(productEventTable)
				.innerJoin(userTable, eq(productEventTable.userId, userTable.id))
				.where(
					and(
						gte(userTable.createdAt, periodStart),
						eq(productEventTable.eventType, 'receipt_parsed'),
						sql`${productEventTable.createdAt} <= ${userTable.createdAt} + interval '24 hours'`
					)
				),
			db
				.select({ userId: inventoryItemTable.userId })
				.from(inventoryItemTable)
				.innerJoin(userTable, eq(inventoryItemTable.userId, userTable.id))
				.where(
					and(
						gte(userTable.createdAt, periodStart),
						sql`${inventoryItemTable.createdAt} <= ${userTable.createdAt} + interval '24 hours'`
					)
				)
				.groupBy(inventoryItemTable.userId)
				.having(sql`count(*)::int >= 5`),
			db
				.selectDistinct({ userId: productEventTable.userId })
				.from(productEventTable)
				.innerJoin(userTable, eq(productEventTable.userId, userTable.id))
				.where(
					and(
						gte(userTable.createdAt, periodStart),
						eq(productEventTable.eventType, 'activation_recipes_shown')
					)
				),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'shared_list_opened'),
						gte(productEventTable.createdAt, periodStart)
					)
				)
		]);

		const onboardingStartedUserIds = userIdsFromEventRows(onboardingRows);
		const receiptParsed24hUserIds = userIdsFromEventRows(receiptParsed24hRows);
		const inventoryFivePlus24hUserIds = new Set(
			inventoryFiveRows
				.map((row) => row.userId)
				.filter((id): id is string => id != null)
		);
		const activationRecipesShownUserIds = userIdsFromEventRows(activationRecipesRows);

		const d7 = computeRetentionRate(cohortUsers, 7, now);
		let d7Retained = 0;
		if (d7.eligibleUsers > 0) {
			const retentionMs = 7 * 24 * 60 * 60 * 1000;
			for (const user of cohortUsers) {
				if (now.getTime() - user.createdAt.getTime() < retentionMs) {
					continue;
				}
				if (
					user.lastSeenAt &&
					user.lastSeenAt.getTime() - user.createdAt.getTime() >= retentionMs
				) {
					d7Retained++;
				}
			}
		}

		return buildActivationFunnelSnapshot({
			periodDays,
			periodStart,
			periodEnd: now,
			cohortUsers: cohortUsers.map((user) => ({
				userId: user.id,
				registeredAt: user.createdAt,
				lastSeenAt: user.lastSeenAt
			})),
			onboardingStartedUserIds,
			receiptParsed24hUserIds,
			inventoryFivePlus24hUserIds,
			activationRecipesShownUserIds,
			d7Retained,
			d7Eligible: d7.eligibleUsers,
			sharedListOpened: sharedListRow[0]?.count ?? 0
		});
	}

	async getLaunchCohortSignups(
		periodDays: PmfFunnelPeriodDays,
		now = new Date()
	): Promise<LaunchCohortSnapshot> {
		const periodMs = periodDays * 24 * 60 * 60 * 1000;
		const periodStart = new Date(now.getTime() - periodMs);

		const events = await db
			.select({
				createdAt: productEventTable.createdAt,
				metadata: productEventTable.metadata
			})
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.eventType, 'signup_complete'),
					gte(productEventTable.createdAt, periodStart)
				)
			);

		return buildLaunchCohortSnapshot({
			periodDays,
			periodStart,
			periodEnd: now,
			events
		});
	}

	async hasHouseholdEvent(householdId: string, eventType: ProductEventType) {
		const count = await this.countHouseholdEventsSince(
			householdId,
			eventType,
			new Date(0)
		);
		return count > 0;
	}

	async countHouseholdEventsSince(
		householdId: string,
		eventType: ProductEventType,
		since: Date
	) {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.householdId, householdId),
					eq(productEventTable.eventType, eventType),
					gte(productEventTable.createdAt, since)
				)
			);

		return row?.count ?? 0;
	}

	async countUserScanEvents(userId: string): Promise<number> {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(productEventTable)
			.where(
				and(eq(productEventTable.userId, userId), eq(productEventTable.eventType, 'scan_completed'))
			);

		return row?.count ?? 0;
	}

	async getUserCreatedAt(userId: string): Promise<Date | null> {
		const [row] = await db
			.select({ createdAt: userTable.createdAt })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		return row?.createdAt ?? null;
	}

	async listRecentHouseholdSyncEvents(
		householdId: string,
		limit: number
	): Promise<HouseholdActivityEvent[]> {
		const rows = await db
			.select({
				id: productEventTable.id,
				householdId: productEventTable.householdId,
				userId: productEventTable.userId,
				eventType: productEventTable.eventType,
				metadata: productEventTable.metadata,
				createdAt: productEventTable.createdAt
			})
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.householdId, householdId),
					inArray(productEventTable.eventType, [
						SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE,
						SYNC_ANALYTICS_EVENTS.BATCH_REVIEW_COMPLETED,
						SYNC_ANALYTICS_EVENTS.STALENESS_CONFIRMED,
						SYNC_ANALYTICS_EVENTS.RECEIPT_FINISH_ACCEPTED
					])
				)
			)
			.orderBy(desc(productEventTable.createdAt))
			.limit(limit);

		return rows.map((row) => {
			const parsed = parseInventoryWriteMetadata(row.metadata);
			return {
				id: row.id,
				householdId: row.householdId ?? householdId,
				userId: row.userId,
				eventType: row.eventType,
				createdAt: row.createdAt,
				action: parsed.action,
				itemId: parsed.itemId
			};
		});
	}

	async countDistinctHouseholdsWithEventSince(eventType: ProductEventType, since: Date): Promise<number> {
		const [row] = await db
			.select({
				count: sql<number>`count(distinct ${productEventTable.householdId})::int`
			})
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.eventType, eventType),
					gte(productEventTable.createdAt, since),
					sql`${productEventTable.householdId} is not null`
				)
			);
		return row?.count ?? 0;
	}

	async getSyncFunnelCounts(now = new Date()): Promise<SyncFunnelCounts> {
		const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const [householdsWithWrite7d, householdsWithBatchReview7d, householdsWithWrite30d] =
			await Promise.all([
				this.countDistinctHouseholdsWithEventSince(SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE, since7d),
				this.countDistinctHouseholdsWithEventSince(
					SYNC_ANALYTICS_EVENTS.BATCH_REVIEW_COMPLETED,
					since7d
				),
				this.countDistinctHouseholdsWithEventSince(SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE, since30d)
			]);

		return {
			householdsWithWrite7d,
			householdsWithBatchReview7d,
			householdsWithWrite30d
		};
	}

	async getAcquisitionMetrics(now = new Date()): Promise<AcquisitionMetricsSnapshot> {
		const periodDays = 7;
		const periodMs = periodDays * 24 * 60 * 60 * 1000;
		const periodEnd = now;
		const periodStart = new Date(now.getTime() - periodMs);
		const eventTypes = [...ACQUISITION_WEEKLY_EVENT_TYPES, ACQUISITION_CTR_EVENT_TYPE];

		const rows = await db
			.select({
				eventType: productEventTable.eventType,
				count: sql<number>`count(*)::int`
			})
			.from(productEventTable)
			.where(
				and(
					inArray(productEventTable.eventType, [...eventTypes]),
					gte(productEventTable.createdAt, periodStart)
				)
			)
			.groupBy(productEventTable.eventType);

		const counts = emptyAcquisitionEventCounts();
		for (const row of rows) {
			const key = row.eventType as keyof AcquisitionEventCounts;
			if (key in counts) {
				counts[key] = row.count ?? 0;
			}
		}

		return buildAcquisitionMetricsSnapshot(counts, periodStart, periodEnd, periodDays);
	}

	async getMarketV01Metrics(now = new Date()): Promise<MarketV01MetricsSnapshot> {
		const periodDays = 7;
		const periodMs = periodDays * 24 * 60 * 60 * 1000;
		const periodEnd = now;
		const periodStart = new Date(now.getTime() - periodMs);

		const [eventRows, activeAutoRows, activeDemoRows] = await Promise.all([
			db
				.select({
					eventType: productEventTable.eventType,
					count: sql<number>`count(*)::int`
				})
				.from(productEventTable)
				.where(
					and(
						inArray(productEventTable.eventType, [...MARKET_V01_METRIC_EVENT_TYPES]),
						gte(productEventTable.createdAt, periodStart)
					)
				)
				.groupBy(productEventTable.eventType),
			db
				.select({
					count: sql<number>`count(*)::int`
				})
				.from(expiringShareLinkTable)
				.where(
					and(
						eq(expiringShareLinkTable.source, 'auto_nearby'),
						gt(expiringShareLinkTable.expiresAt, now)
					)
				),
			db
				.select({
					count: sql<number>`count(*)::int`
				})
				.from(expiringShareLinkTable)
				.where(
					and(
						eq(expiringShareLinkTable.source, 'demo_market'),
						gt(expiringShareLinkTable.expiresAt, now)
					)
				)
		]);

		const counts = emptyMarketV01EventCounts();
		for (const row of eventRows) {
			const key = row.eventType as keyof typeof counts;
			if (key in counts) {
				counts[key] = row.count ?? 0;
			}
		}

		return buildMarketV01MetricsSnapshot({
			counts,
			activeAutoListings: activeAutoRows[0]?.count ?? 0,
			activeDemoListings: activeDemoRows[0]?.count ?? 0,
			periodStart,
			periodEnd,
			periodDays
		});
	}

	async getBrainMetricsSince(since: Date, now = new Date()): Promise<BrainMetricsRawCounts> {
		const reviewEventTypes = ['receipt_import_started', 'receipt_review_completed'] as const;
		const queryableBrainEventTypes = BRAIN_METRIC_EVENT_TYPES.filter(
			(eventType) => eventType !== 'openai_schema_retry'
		);

		const [
			parseRows,
			eventCountRows,
			reviewTimingRows,
			reviewMetadataRows,
			feedbackRows,
			topCorrectedRows
		] = await Promise.all([
			db
				.select({ metadata: productEventTable.metadata })
				.from(productEventTable)
				.where(
					and(eq(productEventTable.eventType, 'receipt_parsed'), gte(productEventTable.createdAt, since))
				),
			db
				.select({
					eventType: productEventTable.eventType,
					count: sql<number>`count(*)::int`
				})
				.from(productEventTable)
				.where(
					and(
						inArray(productEventTable.eventType, [...queryableBrainEventTypes]),
						gte(productEventTable.createdAt, since)
					)
				)
				.groupBy(productEventTable.eventType),
			db
				.select({
					userId: productEventTable.userId,
					eventType: productEventTable.eventType,
					createdAt: productEventTable.createdAt
				})
				.from(productEventTable)
				.where(
					and(
						inArray(productEventTable.eventType, [...reviewEventTypes]),
						gte(productEventTable.createdAt, since),
						sql`${productEventTable.userId} is not null`
					)
				),
			db
				.select({ metadata: productEventTable.metadata })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'receipt_review_completed'),
						gte(productEventTable.createdAt, since)
					)
				),
			db
				.select({
					modelVersion: learningFeedbackTable.modelVersion,
					feedbackType: learningFeedbackTable.feedbackType,
					count: sql<number>`count(*)::int`
				})
				.from(learningFeedbackTable)
				.where(
					and(
						eq(learningFeedbackTable.predictorId, 'shelf_life'),
						inArray(learningFeedbackTable.feedbackType, ['corrected', 'accepted']),
						gte(learningFeedbackTable.createdAt, since)
					)
				)
				.groupBy(learningFeedbackTable.modelVersion, learningFeedbackTable.feedbackType),
			db
				.select({
					subjectKey: learningFeedbackTable.subjectKey,
					productName: sql<string | null>`max(${learningFeedbackTable.contextJson}->>'productName')`,
					correctionCount: sql<number>`count(*)::int`
				})
				.from(learningFeedbackTable)
				.where(
					and(
						eq(learningFeedbackTable.predictorId, 'shelf_life'),
						eq(learningFeedbackTable.feedbackType, 'corrected'),
						gte(learningFeedbackTable.createdAt, since)
					)
				)
				.groupBy(learningFeedbackTable.subjectKey)
				.orderBy(desc(sql`count(*)`))
				.limit(10)
		]);

		let bbfSum = 0;
		let bbfCount = 0;
		let aiBatchUsedCount = 0;
		let highConfidenceSum = 0;
		let highConfidenceCount = 0;
		let aiFallbackSum = 0;
		let aiFallbackCount = 0;
		let totalParsedLines = 0;
		let totalLowLineConfidenceCount = 0;

		for (const row of parseRows) {
			if (!row.metadata) continue;
			try {
				const metadata = JSON.parse(row.metadata) as {
					bbfCoveragePercent?: number;
					aiBatchUsed?: boolean;
					highConfidencePercent?: number;
					aiFallbackPercent?: number;
					lineCount?: number;
					lowLineConfidenceCount?: number;
				};
				if (typeof metadata.bbfCoveragePercent === 'number') {
					bbfSum += metadata.bbfCoveragePercent;
					bbfCount += 1;
				}
				if (metadata.aiBatchUsed) {
					aiBatchUsedCount += 1;
				}
				if (typeof metadata.highConfidencePercent === 'number') {
					highConfidenceSum += metadata.highConfidencePercent;
					highConfidenceCount += 1;
				}
				if (typeof metadata.aiFallbackPercent === 'number') {
					aiFallbackSum += metadata.aiFallbackPercent;
					aiFallbackCount += 1;
				}
				if (typeof metadata.lineCount === 'number') {
					totalParsedLines += metadata.lineCount;
				}
				if (typeof metadata.lowLineConfidenceCount === 'number') {
					totalLowLineConfidenceCount += metadata.lowLineConfidenceCount;
				}
			} catch {
				// skip malformed metadata
			}
		}

		const eventCounts = emptyBrainMetricEventCounts();
		for (const row of eventCountRows) {
			const key = row.eventType as BrainMetricEventType;
			if (key in eventCounts) {
				eventCounts[key] = row.count ?? 0;
			}
		}

		const funnelCounts = emptyBrainReceiptFunnelCounts();
		funnelCounts.receipt_import_started = eventCounts.receipt_import_started;
		funnelCounts.receipt_uploaded = eventCounts.receipt_uploaded;
		funnelCounts.receipt_parsed = eventCounts.receipt_parsed;
		funnelCounts.receipt_review_completed = eventCounts.receipt_review_completed;

		let quickConfirmCount = 0;
		for (const row of reviewMetadataRows) {
			if (!row.metadata) continue;
			try {
				const metadata = JSON.parse(row.metadata) as { quickConfirm?: boolean };
				if (metadata.quickConfirm) quickConfirmCount += 1;
			} catch {
				// skip malformed metadata
			}
		}

		const correctionMap = new Map<
			BrainMetricExpiresOnSource,
			{ corrected: number; accepted: number }
		>();
		for (const row of feedbackRows) {
			const source = modelVersionToExpiresOnSource(row.modelVersion);
			const current = correctionMap.get(source) ?? { corrected: 0, accepted: 0 };
			if (row.feedbackType === 'corrected') {
				current.corrected += row.count ?? 0;
			} else if (row.feedbackType === 'accepted') {
				current.accepted += row.count ?? 0;
			}
			correctionMap.set(source, current);
		}

		const timingEvents = reviewTimingRows
			.filter((row): row is typeof row & { userId: string } => row.userId != null)
			.map((row) => ({
				userId: row.userId,
				eventType: row.eventType,
				createdAt: row.createdAt
			}));

		return {
			periodStart: since,
			periodEnd: now,
			receiptParseCount: parseRows.length,
			avgBbfCoveragePercent: bbfCount > 0 ? Math.round(bbfSum / bbfCount) : 0,
			aiBatchUsedCount,
			receiptParsedAggregates: {
				totalParsedLines,
				avgHighConfidencePercent:
					highConfidenceCount > 0 ? Math.round(highConfidenceSum / highConfidenceCount) : 0,
				avgAiFallbackPercent: aiFallbackCount > 0 ? Math.round(aiFallbackSum / aiFallbackCount) : 0,
				totalLowLineConfidenceCount
			},
			funnelCounts,
			quickConfirmCount,
			reviewCompletedCount: funnelCounts.receipt_review_completed,
			timeToReviewMinutes: computeTimeToReviewMinutes(timingEvents),
			brainExplanationViewed: eventCounts.brain_explanation_viewed,
			eatFirst: {
				eatFirstWeekViewed: eventCounts.eat_first_week_viewed,
				eatFirstPlanApplied: eventCounts.eat_first_plan_applied,
				pantryUseSoonTapped: eventCounts.pantry_use_soon_tapped
			},
			correctionBySource: [...correctionMap.entries()].map(([source, counts]) => ({
				source,
				...counts
			})),
			topCorrectedProducts: topCorrectedRows.map((row) => ({
				subjectKey: row.subjectKey,
				productName: row.productName,
				correctionCount: row.correctionCount ?? 0
			})),
			schemaRetryCount: eventCounts.openai_schema_retry
		};
	}

	async listBrainTimelineEvents(householdId: string, since: Date, limit: number) {
		const rows = await db
			.select({
				id: productEventTable.id,
				eventType: productEventTable.eventType,
				createdAt: productEventTable.createdAt,
				metadata: productEventTable.metadata
			})
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.householdId, householdId),
					gte(productEventTable.createdAt, since),
					inArray(productEventTable.eventType, [
						'receipt_autopilot_accepted',
						'receipt_parsed',
						'kivra_forward_received'
					])
				)
			)
			.orderBy(desc(productEventTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			eventType: row.eventType,
			createdAt: row.createdAt,
			metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null
		}));
	}
}
