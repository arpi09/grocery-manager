import { env } from '$env/dynamic/private';
import type { LinkedInOAuthTokens } from '$lib/domain/app-settings';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import { isLinkedInApiConfigured } from '$lib/server/linkedin-oauth';
import { isMarketV01DisabledByEnv } from '$lib/domain/market-v01';
import { isStripeCheckoutConfigured, resolveStripeCheckoutEnabled } from '$lib/server/stripe';

export const EMAIL_SENDING_DISABLED_REASON = 'Email sending is disabled';

export interface EmailSendingStatus {
	/** Admin toggle in database (default false when unset). */
	enabledInApp: boolean;
	/** Hard kill switch from EMAIL_SENDING_DISABLED env var. */
	envDisabled: boolean;
	/** Whether sendEmail will actually call Resend. */
	effective: boolean;
}

export function isEmailSendingDisabledByEnv(): boolean {
	const value = env.EMAIL_SENDING_DISABLED?.trim().toLowerCase();
	return value === 'true' || value === '1';
}

export function isEmailSendingDisabledFailure(result: { ok: false; reason: string }): boolean {
	return result.reason === EMAIL_SENDING_DISABLED_REASON;
}

export interface StripeCheckoutStatus {
	/** Admin toggle in database (default false when unset). */
	enabledInApp: boolean;
	/** Hard kill switch from STRIPE_CHECKOUT_DISABLED env var. */
	envDisabled: boolean;
	/** Whether Stripe secret key and price IDs are configured. */
	keysConfigured: boolean;
	/** Whether checkout/portal sessions can be created. */
	effective: boolean;
}

export function isStripeCheckoutDisabledByEnv(): boolean {
	const value = env.STRIPE_CHECKOUT_DISABLED?.trim().toLowerCase();
	return value === 'true' || value === '1';
}

export interface MarketLiveStatus {
	/** Admin toggle in database (default false when unset). */
	enabledInApp: boolean;
	/** Hard kill switch from MARKET_V01_DISABLED env var. */
	envDisabled: boolean;
	/** Whether regular users may access market UI (admin always when backend on). */
	effective: boolean;
}

export class AppSettingsService {
	constructor(private readonly settings: IAppSettingsRepository) {}

	async getEmailSendingStatus(): Promise<EmailSendingStatus> {
		const enabledInApp = await this.settings.getEmailSendingEnabled();
		const envDisabled = isEmailSendingDisabledByEnv();
		return {
			enabledInApp,
			envDisabled,
			effective: enabledInApp && !envDisabled
		};
	}

	async isEmailSendingEnabled(): Promise<boolean> {
		const status = await this.getEmailSendingStatus();
		return status.effective;
	}

	setEmailSendingEnabled(enabled: boolean): Promise<void> {
		return this.settings.setEmailSendingEnabled(enabled);
	}

	async getStripeCheckoutStatus(): Promise<StripeCheckoutStatus> {
		const enabledInApp = await this.settings.getStripeCheckoutEnabled();
		const envDisabled = isStripeCheckoutDisabledByEnv();
		const keysConfigured = isStripeCheckoutConfigured();
		return {
			enabledInApp,
			envDisabled,
			keysConfigured,
			effective: resolveStripeCheckoutEnabled({ keysConfigured, enabledInApp, envDisabled })
		};
	}

	async isStripeCheckoutEnabled(): Promise<boolean> {
		const status = await this.getStripeCheckoutStatus();
		return status.effective;
	}

	setStripeCheckoutEnabled(enabled: boolean): Promise<void> {
		return this.settings.setStripeCheckoutEnabled(enabled);
	}

	async getMarketLiveStatus(): Promise<MarketLiveStatus> {
		const enabledInApp = await this.settings.getMarketLiveEnabled();
		const envDisabled = isMarketV01DisabledByEnv();
		return {
			enabledInApp,
			envDisabled,
			effective: enabledInApp && !envDisabled
		};
	}

	async isMarketLiveEnabled(): Promise<boolean> {
		const status = await this.getMarketLiveStatus();
		return status.effective;
	}

	setMarketLiveEnabled(enabled: boolean): Promise<void> {
		return this.settings.setMarketLiveEnabled(enabled);
	}

	async getLinkedInOAuth(): Promise<LinkedInOAuthTokens | null> {
		return this.settings.getLinkedInOAuth();
	}

	async setLinkedInOAuth(tokens: LinkedInOAuthTokens | null): Promise<void> {
		return this.settings.setLinkedInOAuth(tokens);
	}

	async isLinkedInConnected(): Promise<boolean> {
		const tokens = await this.settings.getLinkedInOAuth();
		return Boolean(tokens?.refreshToken);
	}

	isLinkedInApiConfigured(): boolean {
		return isLinkedInApiConfigured();
	}
}
