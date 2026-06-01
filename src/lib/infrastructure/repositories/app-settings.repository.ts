import { APP_SETTING_EMAIL_SENDING_ENABLED } from '$lib/domain/app-settings';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { appSettingsTable } from '$lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export interface IAppSettingsRepository {
	getBoolean(key: string): Promise<boolean | null>;
	setBoolean(key: string, value: boolean): Promise<void>;
	getEmailSendingEnabled(): Promise<boolean>;
	setEmailSendingEnabled(enabled: boolean): Promise<void>;
}

export class DrizzleAppSettingsRepository implements IAppSettingsRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async getBoolean(key: string): Promise<boolean | null> {
		const rows = await this.db
			.select({ value: appSettingsTable.value })
			.from(appSettingsTable)
			.where(eq(appSettingsTable.key, key))
			.limit(1);

		const raw = rows[0]?.value;
		if (raw === 'true') return true;
		if (raw === 'false') return false;
		return null;
	}

	async setBoolean(key: string, value: boolean): Promise<void> {
		const now = new Date();
		await this.db
			.insert(appSettingsTable)
			.values({
				key,
				value: value ? 'true' : 'false',
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: appSettingsTable.key,
				set: {
					value: value ? 'true' : 'false',
					updatedAt: now
				}
			});
	}

	async getEmailSendingEnabled(): Promise<boolean> {
		return (await this.getBoolean(APP_SETTING_EMAIL_SENDING_ENABLED)) ?? false;
	}

	async setEmailSendingEnabled(enabled: boolean): Promise<void> {
		await this.setBoolean(APP_SETTING_EMAIL_SENDING_ENABLED, enabled);
	}
}
