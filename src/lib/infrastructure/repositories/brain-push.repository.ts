import { and, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import {
	brainPushDayKey,
	canSendBrainPush,
	nextBrainPushDailyState,
	PRE_SHOP_BRIEFING_INTERVAL_DAYS,
	shouldSendIntervalPush,
	WEEKLY_BRIEFING_INTERVAL_DAYS
} from '$lib/domain/brain-push-guard';

export interface BrainPushUser {
	id: string;
	displayName: string | null;
	pushNotificationsEnabled: boolean;
	brainPushDailyCount: number;
	brainPushDailyDate: string | null;
	weeklyBriefingLastSentAt: Date | null;
	preShopBriefingLastSentAt: Date | null;
}

export interface BrainPushDailyClaimResult {
	claimed: boolean;
	reason?: 'disabled' | 'daily_limit';
	previousDailyCount: number;
	previousDailyDate: string | null;
}

export interface IBrainPushRepository {
	listPushEnabledUsers(): Promise<BrainPushUser[]>;
	findUserById(userId: string): Promise<BrainPushUser | null>;
	tryClaimDailyPush(userId: string, sentAt?: Date): Promise<BrainPushDailyClaimResult>;
	revertDailyPushClaim(
		userId: string,
		previousDailyCount: number,
		previousDailyDate: string | null
	): Promise<void>;
	tryClaimWeeklyBriefing(userId: string, sentAt?: Date): Promise<boolean>;
	tryClaimPreShopBriefing(userId: string, sentAt?: Date): Promise<boolean>;
}

function normalizeDailyDate(value: string | Date | null | undefined): string | null {
	if (!value) return null;
	if (typeof value === 'string') return value;
	return value.toISOString().slice(0, 10);
}

function mapUser(row: {
	id: string;
	displayName: string | null;
	pushNotificationsEnabled: boolean;
	brainPushDailyCount: number;
	brainPushDailyDate: string | Date | null;
	weeklyBriefingLastSentAt: Date | null;
	preShopBriefingLastSentAt: Date | null;
}): BrainPushUser {
	return {
		id: row.id,
		displayName: row.displayName,
		pushNotificationsEnabled: row.pushNotificationsEnabled,
		brainPushDailyCount: row.brainPushDailyCount,
		brainPushDailyDate: normalizeDailyDate(row.brainPushDailyDate),
		weeklyBriefingLastSentAt: row.weeklyBriefingLastSentAt,
		preShopBriefingLastSentAt: row.preShopBriefingLastSentAt
	};
}

const brainPushUserSelect = {
	id: userTable.id,
	displayName: userTable.displayName,
	pushNotificationsEnabled: userTable.pushNotificationsEnabled,
	brainPushDailyCount: userTable.brainPushDailyCount,
	brainPushDailyDate: userTable.brainPushDailyDate,
	weeklyBriefingLastSentAt: userTable.weeklyBriefingLastSentAt,
	preShopBriefingLastSentAt: userTable.preShopBriefingLastSentAt
};

export class DrizzleBrainPushRepository implements IBrainPushRepository {
	async listPushEnabledUsers(): Promise<BrainPushUser[]> {
		const rows = await db
			.select(brainPushUserSelect)
			.from(userTable)
			.where(eq(userTable.pushNotificationsEnabled, true));
		return rows.map(mapUser);
	}

	async findUserById(userId: string): Promise<BrainPushUser | null> {
		const [row] = await db
			.select(brainPushUserSelect)
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		return row ? mapUser(row) : null;
	}

	async tryClaimDailyPush(userId: string, sentAt = new Date()): Promise<BrainPushDailyClaimResult> {
		const [row] = await db
			.select(brainPushUserSelect)
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!row || !row.pushNotificationsEnabled) {
			return {
				claimed: false,
				reason: 'disabled',
				previousDailyCount: row?.brainPushDailyCount ?? 0,
				previousDailyDate: normalizeDailyDate(row?.brainPushDailyDate)
			};
		}

		const previousDailyDate = normalizeDailyDate(row.brainPushDailyDate);
		const previousDailyCount = row.brainPushDailyCount;

		if (!canSendBrainPush(previousDailyCount, previousDailyDate, sentAt)) {
			return {
				claimed: false,
				reason: 'daily_limit',
				previousDailyCount,
				previousDailyDate
			};
		}

		const next = nextBrainPushDailyState(previousDailyCount, previousDailyDate, sentAt);
		await db
			.update(userTable)
			.set({
				brainPushDailyCount: next.count,
				brainPushDailyDate: next.date
			})
			.where(eq(userTable.id, userId));

		return {
			claimed: true,
			previousDailyCount,
			previousDailyDate
		};
	}

	async revertDailyPushClaim(
		userId: string,
		previousDailyCount: number,
		previousDailyDate: string | null
	): Promise<void> {
		await db
			.update(userTable)
			.set({
				brainPushDailyCount: previousDailyCount,
				brainPushDailyDate: previousDailyDate
			})
			.where(eq(userTable.id, userId));
	}

	async tryClaimWeeklyBriefing(userId: string, sentAt = new Date()): Promise<boolean> {
		const [row] = await db
			.select({
				id: userTable.id,
				weeklyBriefingLastSentAt: userTable.weeklyBriefingLastSentAt
			})
			.from(userTable)
			.where(and(eq(userTable.id, userId), eq(userTable.pushNotificationsEnabled, true)))
			.limit(1);

		if (!row) return false;
		if (!shouldSendIntervalPush(row.weeklyBriefingLastSentAt, WEEKLY_BRIEFING_INTERVAL_DAYS, sentAt)) {
			return false;
		}

		await db
			.update(userTable)
			.set({ weeklyBriefingLastSentAt: sentAt })
			.where(eq(userTable.id, userId));
		return true;
	}

	async tryClaimPreShopBriefing(userId: string, sentAt = new Date()): Promise<boolean> {
		const [row] = await db
			.select({
				id: userTable.id,
				preShopBriefingLastSentAt: userTable.preShopBriefingLastSentAt
			})
			.from(userTable)
			.where(and(eq(userTable.id, userId), eq(userTable.pushNotificationsEnabled, true)))
			.limit(1);

		if (!row) return false;
		if (
			!shouldSendIntervalPush(row.preShopBriefingLastSentAt, PRE_SHOP_BRIEFING_INTERVAL_DAYS, sentAt)
		) {
			return false;
		}

		await db
			.update(userTable)
			.set({ preShopBriefingLastSentAt: sentAt })
			.where(eq(userTable.id, userId));
		return true;
	}
}

/** @internal test helper */
export function __brainPushDayKeyForTests(date: Date): string {
	return brainPushDayKey(date);
}
