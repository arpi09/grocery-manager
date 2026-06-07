import type { AppErrorSummary } from '$lib/domain/error-log';

export const APP_SETTING_ERROR_ALERT_CURSOR = 'error_alert_cursor';

export interface ErrorAlertCursor {
	sentAt: string;
}

export interface ErrorAlertEmailContent {
	subject: string;
	html: string;
	text: string;
}

function formatErrorLine(entry: AppErrorSummary): string {
	const when = entry.createdAt.toISOString().replace('T', ' ').slice(0, 16);
	const status = entry.statusCode ?? '—';
	return `[${when} UTC] ${status} ${entry.path}\n  ${entry.message}`;
}

export function buildErrorAlertEmailContent(options: {
	errors: AppErrorSummary[];
	adminUrl: string;
}): ErrorAlertEmailContent {
	const { errors, adminUrl } = options;
	const count = errors.length;
	const subject =
		count === 1
			? 'Skaffu prod: 1 nytt fel i error logs'
			: `Skaffu prod: ${count} nya fel i error logs`;

	const lines = errors.map(formatErrorLine);
	const text = [
		`Skaffu har ${count} nya fel sedan senaste alert.`,
		'',
		...lines,
		'',
		`Admin error logs: ${adminUrl}`,
		'',
		'Skickat automatiskt av error-alert cron.'
	].join('\n');

	const listHtml = errors
		.map((entry) => {
			const when = entry.createdAt.toISOString().replace('T', ' ').slice(0, 16);
			const status = entry.statusCode ?? '—';
			const safePath = escapeHtml(entry.path);
			const safeMessage = escapeHtml(entry.message);
			return `<li><strong>${when} UTC</strong> · ${status} · <code>${safePath}</code><br />${safeMessage}</li>`;
		})
		.join('');

	const html = `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1f2a24;">
  <h1 style="font-size:20px;">${count} nya prod-fel</h1>
  <p>Granska i admin innan användare behöver rapportera manuellt.</p>
  <ul>${listHtml}</ul>
  <p><a href="${escapeHtml(adminUrl)}">Öppna admin → Error logs</a></p>
</body>
</html>`;

	return { subject, html, text };
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
