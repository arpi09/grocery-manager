import { and, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';

export interface ShoppingPushSettings {
	enabled: boolean;
	lastSentAt: Date | null;
}

export interface ShoppingPushUser {
	id: string;
	settings: ShoppingPushSettings;
	pushNotificationsEnabled: boolean;
}

export interface IShoppingPushRepository {
	getSettings(userId: string): Promise<ShoppingPushSettings>;
	updateSettings(userId: string, enabled: boolean): Promise<void>;
	listOptedInUsers(): Promise<ShoppingPushUser[]>;
	markPushSent(userId: string, sentAt?: Date): Promise<void>;
}

export class DrizzleShoppingPushRepository implements IShoppingPushRepository {
	async getSettings(userId: string): Promise<ShoppingPushSettings> {
		const [row] = await db
			.select({
				shoppingPushEnabled: userTable.shoppingPushEnabled,
				shoppingPushLastSentAt: userTable.shoppingPushLastSentAt
			})
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!row) {
			return { enabled: false, lastSentAt: null };
		}

		return {
			enabled: row.shoppingPushEnabled,
			lastSentAt: row.shoppingPushLastSentAt
		};
	}

	async updateSettings(userId: string, enabled: boolean): Promise<void> {
		await db
			.update(userTable)
			.set({ shoppingPushEnabled: enabled })
			.where(eq(userTable.id, userId));
	}

	async listOptedInUsers(): Promise<ShoppingPushUser[]> {
		const rows = await db
			.select({
				id: userTable.id,
				shoppingPushEnabled: userTable.shoppingPushEnabled,
				shoppingPushLastSentAt: userTable.shoppingPushLastSentAt,
				pushNotificationsEnabled: userTable.pushNotificationsEnabled
			})
			.from(userTable)
			.where(
				and(
					eq(userTable.shoppingPushEnabled, true),
					eq(userTable.pushNotificationsEnabled, true)
				)
			);

		return rows.map((row) => ({
			id: row.id,
			settings: {
				enabled: row.shoppingPushEnabled,
				lastSentAt: row.shoppingPushLastSentAt
			},
			pushNotificationsEnabled: row.pushNotificationsEnabled
		}));
	}

	async markPushSent(userId: string, sentAt = new Date()): Promise<void> {
		await db
			.update(userTable)
			.set({ shoppingPushLastSentAt: sentAt })
			.where(eq(userTable.id, userId));
	}
}
