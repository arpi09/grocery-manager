import {
	APP_SETTING_ERROR_ALERT_CURSOR,
	buildErrorAlertEmailContent,
	type ErrorAlertCursor
} from '$lib/domain/error-alert';
import type { IErrorLogRepository } from '$lib/infrastructure/repositories/error-log.repository';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { EmailPort } from '$lib/application/ports/email.port';

/** Default lookback when no cursor exists (matches cron interval + buffer). */
export const ERROR_ALERT_INITIAL_LOOKBACK_MS = 35 * 60 * 1000;

export interface ErrorAlertRunResult {
	sent: boolean;
	skipped?: string;
	count?: number;
	emailId?: string;
}

export class ErrorAlertService {
	constructor(
		private readonly errorLog: Pick<IErrorLogRepository, 'listSummariesSince'>,
		private readonly settings: Pick<IAppSettingsRepository, 'getJson' | 'setJson'>,
		private readonly email: Pick<EmailPort, 'getErrorAlertTo' | 'sendOwnerErrorAlert'>,
		private readonly appOrigin: AppOriginPort
	) {}

	async runAlertDigest(): Promise<ErrorAlertRunResult> {
		const to = this.email.getErrorAlertTo();
		if (!to) {
			console.warn('[error-alert] ERROR_ALERT_TO / PMF_DIGEST_TO not configured; skipped');
			return { sent: false, skipped: 'alert recipient not configured' };
		}

		const cursor = await this.settings.getJson<ErrorAlertCursor>(APP_SETTING_ERROR_ALERT_CURSOR);
		const since = cursor?.sentAt
			? new Date(cursor.sentAt)
			: new Date(Date.now() - ERROR_ALERT_INITIAL_LOOKBACK_MS);

		const errors = await this.errorLog.listSummariesSince(since, 25);
		if (errors.length === 0) {
			return { sent: false, skipped: 'no new errors' };
		}

		const content = buildErrorAlertEmailContent({
			errors,
			adminUrl: `${this.appOrigin.getOrigin()}/admin`
		});

		const result = await this.email.sendOwnerErrorAlert({
			to,
			subject: content.subject,
			html: content.html,
			text: content.text
		});

		if (!result.ok) {
			console.error(`[error-alert] Failed to send: ${result.reason}`);
			return { sent: false, skipped: result.reason, count: errors.length };
		}

		const latest = errors.reduce(
			(max, entry) => (entry.createdAt > max ? entry.createdAt : max),
			errors[0].createdAt
		);
		await this.settings.setJson(APP_SETTING_ERROR_ALERT_CURSOR, {
			sentAt: latest.toISOString()
		});

		console.info(`[error-alert] Sent alert for ${errors.length} error(s) to ${to}`);
		return { sent: true, count: errors.length, emailId: result.id };
	}
}
