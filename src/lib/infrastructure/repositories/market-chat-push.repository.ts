import { eq } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { userTable } from '$lib/infrastructure/db/schema';

export interface MarketChatPushSettings {
	enabled: boolean;
}

export interface IMarketChatPushRepository {
	getSettings(userId: string): Promise<MarketChatPushSettings>;
	updateSettings(userId: string, enabled: boolean): Promise<void>;
	isEnabled(userId: string): Promise<boolean>;
}

export class DrizzleMarketChatPushRepository implements IMarketChatPushRepository {
	constructor(private readonly database: AppDatabase = defaultDb) {}

	async getSettings(userId: string): Promise<MarketChatPushSettings> {
		const [row] = await this.database
			.select({ marketChatPushEnabled: userTable.marketChatPushEnabled })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		return { enabled: row?.marketChatPushEnabled ?? false };
	}

	async updateSettings(userId: string, enabled: boolean): Promise<void> {
		await this.database
			.update(userTable)
			.set({ marketChatPushEnabled: enabled })
			.where(eq(userTable.id, userId));
	}

	async isEnabled(userId: string): Promise<boolean> {
		const settings = await this.getSettings(userId);
		return settings.enabled;
	}
}
