import { eq, or } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';
import {
	DEFAULT_EXPIRY_REMINDER_DAYS,
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

export interface IExpiryReminderRepository {
	getSettings(userId: string): Promise<ExpiryReminderSettings>;
	updateSettings(userId: string, settings: { enabled: boolean; days: ExpiryReminderDays }): Promise<void>;
	listOptedInUsers(): Promise<ExpiryReminderUser[]>;
	findUserById(userId: string): Promise<ExpiryReminderUser | null>;
	markReminderSent(userId: string, sentAt?: Date): Promise<void>;
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
}
