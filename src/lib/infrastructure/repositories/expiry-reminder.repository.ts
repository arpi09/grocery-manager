import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import {
	DEFAULT_EXPIRY_REMINDER_DAYS,
	EXPIRY_REMINDER_INTERVAL_DAYS,
	expiryReminderClaimCutoff,
	normalizeExpiryReminderDays,
	type ExpiryReminderDays
} from '$lib/domain/expiry-reminder';

export interface ExpiryReminderSettings {
	enabled: boolean;
	days: ExpiryReminderDays;
	lastSentAt: Date | null;
}

export interface ExpiryReminderUser {
	id: string;
	email: string;
	displayName: string | null;
	settings: ExpiryReminderSettings;
	pushNotificationsEnabled: boolean;
}

export interface ReminderSendClaimResult {
	claimed: boolean;
	previousLastSentAt: Date | null;
}

export interface IExpiryReminderRepository {
	getSettings(userId: string): Promise<ExpiryReminderSettings>;
	updateSettings(userId: string, settings: { enabled: boolean; days: ExpiryReminderDays }): Promise<void>;
	listOptedInUsers(): Promise<ExpiryReminderUser[]>;
	findUserById(userId: string): Promise<ExpiryReminderUser | null>;
	markReminderSent(userId: string, sentAt?: Date): Promise<void>;
	tryClaimReminderSend(
		userId: string,
		sentAt?: Date,
		intervalDays?: number
	): Promise<ReminderSendClaimResult>;
	revertReminderSendClaim(userId: string, previousLastSentAt: Date | null): Promise<void>;
	tryClaimMovingSoonSend(userId: string, sentAt?: Date): Promise<ReminderSendClaimResult>;
	revertMovingSoonSendClaim(userId: string, previousLastSentAt: Date | null): Promise<void>;
}

function mapSettings(row: {
	expiryRemindersEnabled: boolean;
	expiryReminderDays: number;
	expiryReminderLastSentAt: Date | null;
}): ExpiryReminderSettings {
	return {
		enabled: row.expiryRemindersEnabled,
		days: normalizeExpiryReminderDays(row.expiryReminderDays),
		lastSentAt: row.expiryReminderLastSentAt
	};
}

export class DrizzleExpiryReminderRepository implements IExpiryReminderRepository {
	async getSettings(userId: string): Promise<ExpiryReminderSettings> {
		const [row] = await db
			.select({
				expiryRemindersEnabled: userTable.expiryRemindersEnabled,
				expiryReminderDays: userTable.expiryReminderDays,
				expiryReminderLastSentAt: userTable.expiryReminderLastSentAt
			})
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!row) {
			return {
				enabled: false,
				days: DEFAULT_EXPIRY_REMINDER_DAYS,
				lastSentAt: null
			};
		}

		return mapSettings(row);
	}

	async updateSettings(
		userId: string,
		settings: { enabled: boolean; days: ExpiryReminderDays }
	): Promise<void> {
		await db
			.update(userTable)
			.set({
				expiryRemindersEnabled: settings.enabled,
				expiryReminderDays: settings.days
			})
			.where(eq(userTable.id, userId));
	}

	async listOptedInUsers(): Promise<ExpiryReminderUser[]> {
		const rows = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				displayName: userTable.displayName,
				expiryRemindersEnabled: userTable.expiryRemindersEnabled,
				expiryReminderDays: userTable.expiryReminderDays,
				expiryReminderLastSentAt: userTable.expiryReminderLastSentAt,
				pushNotificationsEnabled: userTable.pushNotificationsEnabled
			})
			.from(userTable)
			.where(
				or(
					eq(userTable.expiryRemindersEnabled, true),
					eq(userTable.pushNotificationsEnabled, true)
				)
			);

		return rows.map((row) => ({
			id: row.id,
			email: row.email,
			displayName: row.displayName,
			settings: mapSettings(row),
			pushNotificationsEnabled: row.pushNotificationsEnabled
		}));
	}

	async findUserById(userId: string): Promise<ExpiryReminderUser | null> {
		const [row] = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				displayName: userTable.displayName,
				expiryRemindersEnabled: userTable.expiryRemindersEnabled,
				expiryReminderDays: userTable.expiryReminderDays,
				expiryReminderLastSentAt: userTable.expiryReminderLastSentAt,
				pushNotificationsEnabled: userTable.pushNotificationsEnabled
			})
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!row) {
			return null;
		}

		return {
			id: row.id,
			email: row.email,
			displayName: row.displayName,
			settings: mapSettings(row),
			pushNotificationsEnabled: row.pushNotificationsEnabled
		};
	}

	async markReminderSent(userId: string, sentAt = new Date()): Promise<void> {
		await db
			.update(userTable)
			.set({ expiryReminderLastSentAt: sentAt })
			.where(eq(userTable.id, userId));
	}

	async tryClaimReminderSend(
		userId: string,
		sentAt = new Date(),
		intervalDays = EXPIRY_REMINDER_INTERVAL_DAYS
	): Promise<ReminderSendClaimResult> {
		const [current] = await db
			.select({ expiryReminderLastSentAt: userTable.expiryReminderLastSentAt })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		const previousLastSentAt = current?.expiryReminderLastSentAt ?? null;
		const cutoff = expiryReminderClaimCutoff(sentAt, intervalDays);
		const cutoffIso = cutoff.toISOString();

		const updated = await db
			.update(userTable)
			.set({ expiryReminderLastSentAt: sentAt })
			.where(
				and(
					eq(userTable.id, userId),
					or(
						isNull(userTable.expiryReminderLastSentAt),
						sql`date_trunc('day', ${userTable.expiryReminderLastSentAt}) <= date_trunc('day', ${cutoffIso}::timestamptz)`
					)
				)
			)
			.returning();

		return {
			claimed: updated.length > 0,
			previousLastSentAt
		};
	}

	async revertReminderSendClaim(userId: string, previousLastSentAt: Date | null): Promise<void> {
		await db
			.update(userTable)
			.set({ expiryReminderLastSentAt: previousLastSentAt })
			.where(eq(userTable.id, userId));
	}

	async tryClaimMovingSoonSend(userId: string, sentAt = new Date()): Promise<ReminderSendClaimResult> {
		const [current] = await db
			.select({ expiryMovingSoonLastSentAt: userTable.expiryMovingSoonLastSentAt })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		const previousLastSentAt = current?.expiryMovingSoonLastSentAt ?? null;
		const cutoff = expiryReminderClaimCutoff(sentAt, 1);
		const cutoffIso = cutoff.toISOString();

		const updated = await db
			.update(userTable)
			.set({ expiryMovingSoonLastSentAt: sentAt })
			.where(
				and(
					eq(userTable.id, userId),
					or(
						isNull(userTable.expiryMovingSoonLastSentAt),
						sql`date_trunc('day', ${userTable.expiryMovingSoonLastSentAt}) <= date_trunc('day', ${cutoffIso}::timestamptz)`
					)
				)
			)
			.returning();

		return {
			claimed: updated.length > 0,
			previousLastSentAt
		};
	}

	async revertMovingSoonSendClaim(userId: string, previousLastSentAt: Date | null): Promise<void> {
		await db
			.update(userTable)
			.set({ expiryMovingSoonLastSentAt: previousLastSentAt })
			.where(eq(userTable.id, userId));
	}
}
