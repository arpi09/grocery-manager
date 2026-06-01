import { env } from '$env/dynamic/private';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';

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
}
