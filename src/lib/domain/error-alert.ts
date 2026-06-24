import type { AppErrorSummary } from '$lib/domain/error-log';
import { BRAND_FONT_STACK_EMAIL } from '$lib/design/brand/typography';
import { BRAND_BG, BRAND_PRIMARY, LOCKED_LOGO_CORE } from '$lib/design/brand-colors';

const EMAIL = LOCKED_LOGO_CORE.light;

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
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: ${BRAND_FONT_STACK_EMAIL}; color: ${EMAIL.text}; background: ${BRAND_BG}; margin: 0; padding: 24px 16px; }
    .card { max-width: 640px; margin: 0 auto; background: ${EMAIL.surface}; border: 1px solid ${EMAIL.border}; border-radius: 16px; overflow: hidden; }
    .header { background: ${BRAND_PRIMARY}; color: ${EMAIL.onPrimary}; padding: 24px 28px; }
    .header-brand { margin: 0 0 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.85; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { padding: 28px; line-height: 1.5; }
    ul { padding-left: 20px; }
    a { color: ${BRAND_PRIMARY}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p class="header-brand">Skaffu</p>
      <h1>${count} nya prod-fel</h1>
    </div>
    <div class="body">
      <p>Granska i admin innan användare behöver rapportera manuellt.</p>
      <ul>${listHtml}</ul>
      <p><a href="${escapeHtml(adminUrl)}">Öppna admin → Error logs</a></p>
    </div>
  </div>
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
