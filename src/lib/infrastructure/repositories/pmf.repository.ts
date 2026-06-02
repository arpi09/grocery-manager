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
}
