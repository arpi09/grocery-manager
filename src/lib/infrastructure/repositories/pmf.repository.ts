import {
	buildPmfFunnelSnapshot,
	FUNNEL_ACTIVITY_EVENT_TYPES,
	FUNNEL_FIRST_SCAN_EVENT_TYPES,
	type PmfFunnelPeriodDays,
	type PmfFunnelSnapshot
} from '$lib/domain/pmf-funnel';
import {
	computeActivationRate,
	computeMultiMemberHouseholdRate,
	computeRetentionRate,
	computeSmartFillWeeklyRate,
	computeWeeklyScanRate,
	medianMinutesToFirstScan,
	type PmfMetricSnapshot,
	type PmfProductEventType,
	type ProductEventType,
	WAU_WINDOW_MS
} from '$lib/domain/pmf';
import { generateId } from '$lib/infrastructure/auth/id';
import { db } from '$lib/infrastructure/db';
import {
	householdMemberTable,
	inventoryItemTable,
	productEventTable,
	userTable
} from '$lib/infrastructure/db/schema';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

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
	hasHouseholdEvent(householdId: string, eventType: ProductEventType): Promise<boolean>;
	countUserScanEvents(userId: string): Promise<number>;
	getUserCreatedAt(userId: string): Promise<Date | null>;
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

		const [users, activationItemRows, receiptActivationRows, firstScanRows, weeklyScanRows, weeklyFillRows, householdMembers, eventCountRows] =
			await Promise.all([
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

		const eventCounts: Record<PmfProductEventType, number> = {
			scan_completed: 0,
			receipt_parsed: 0,
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

	async hasHouseholdEvent(householdId: string, eventType: ProductEventType) {
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(productEventTable)
			.where(
				and(
					eq(productEventTable.householdId, householdId),
					eq(productEventTable.eventType, eventType)
				)
			);

		return (row?.count ?? 0) > 0;
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
}
