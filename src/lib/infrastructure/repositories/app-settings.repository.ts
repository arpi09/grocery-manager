import {
	APP_SETTING_EMAIL_SENDING_ENABLED,
	APP_SETTING_LINKEDIN_OAUTH,
	APP_SETTING_MARKET_LIVE_ENABLED,
	APP_SETTING_STRIPE_CHECKOUT_ENABLED,
	type LinkedInOAuthTokens
} from '$lib/domain/app-settings';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { appSettingsTable } from '$lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export interface IAppSettingsRepository {
	getBoolean(key: string): Promise<boolean | null>;
	setBoolean(key: string, value: boolean): Promise<void>;
	getJson<T>(key: string): Promise<T | null>;
	setJson(key: string, value: unknown): Promise<void>;
	getEmailSendingEnabled(): Promise<boolean>;
	setEmailSendingEnabled(enabled: boolean): Promise<void>;
	getStripeCheckoutEnabled(): Promise<boolean>;
	setStripeCheckoutEnabled(enabled: boolean): Promise<void>;
	getMarketLiveEnabled(): Promise<boolean>;
	setMarketLiveEnabled(enabled: boolean): Promise<void>;
	getLinkedInOAuth(): Promise<LinkedInOAuthTokens | null>;
	setLinkedInOAuth(tokens: LinkedInOAuthTokens | null): Promise<void>;
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

	async getJson<T>(key: string): Promise<T | null> {
		const rows = await this.db
			.select({ value: appSettingsTable.value })
			.from(appSettingsTable)
			.where(eq(appSettingsTable.key, key))
			.limit(1);

		const raw = rows[0]?.value;
		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	async setJson(key: string, value: unknown): Promise<void> {
		const now = new Date();
		await this.db
			.insert(appSettingsTable)
			.values({
				key,
				value: JSON.stringify(value),
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: appSettingsTable.key,
				set: {
					value: JSON.stringify(value),
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

	async getStripeCheckoutEnabled(): Promise<boolean> {
		return (await this.getBoolean(APP_SETTING_STRIPE_CHECKOUT_ENABLED)) ?? false;
	}

	async setStripeCheckoutEnabled(enabled: boolean): Promise<void> {
		await this.setBoolean(APP_SETTING_STRIPE_CHECKOUT_ENABLED, enabled);
	}

	async getMarketLiveEnabled(): Promise<boolean> {
		return (await this.getBoolean(APP_SETTING_MARKET_LIVE_ENABLED)) ?? false;
	}

	async setMarketLiveEnabled(enabled: boolean): Promise<void> {
		await this.setBoolean(APP_SETTING_MARKET_LIVE_ENABLED, enabled);
	}

	async getLinkedInOAuth(): Promise<LinkedInOAuthTokens | null> {
		return this.getJson<LinkedInOAuthTokens>(APP_SETTING_LINKEDIN_OAUTH);
	}

	async setLinkedInOAuth(tokens: LinkedInOAuthTokens | null): Promise<void> {
		if (!tokens) {
			await this.db.delete(appSettingsTable).where(eq(appSettingsTable.key, APP_SETTING_LINKEDIN_OAUTH));
			return;
		}
		await this.setJson(APP_SETTING_LINKEDIN_OAUTH, tokens);
	}
}
