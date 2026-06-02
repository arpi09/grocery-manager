import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { inviteRoleLabel, type InviteRole } from '$lib/domain/household';
import { getAppOrigin } from '$lib/server/origin';
import {
	EMAIL_SENDING_DISABLED_REASON,
	isEmailSendingDisabledByEnv
} from '$lib/application/app-settings.service';
import { appSettingsService } from '$lib/server/di';

export {
	EMAIL_SENDING_DISABLED_REASON,
	isEmailSendingDisabledByEnv,
	isEmailSendingDisabledFailure
} from '$lib/application/app-settings.service';

const DEFAULT_FROM = 'Skaffu <onboarding@resend.dev>';
const RESEND_DOCS_URL = 'https://resend.com/docs/send-with-nextjs';

export function getResendApiKey(): string | null {
	const key = env.RESEND_API_KEY?.trim();
	return key ? key : null;
}

export function getEmailFrom(): string {
	const from = env.RESEND_FROM?.trim();
	return from || DEFAULT_FROM;
}

/** Owner PMF digest recipient — when set, cron digest bypasses EMAIL_SENDING_DISABLED. */
export function getPmfDigestTo(): string | null {
	const to = env.PMF_DIGEST_TO?.trim();
	return to ? to : null;
}

export function missingResendKeyMessage(): string {
	return 'RESEND_API_KEY saknas. Lägg till den i din .env (se .env.example).';
}

export type SendEmailFailure = { ok: false; reason: string; statusCode?: number };

export type SendEmailResult = { ok: true; id?: string } | SendEmailFailure;

function resendErrorStatusCode(error: unknown): number | undefined {
	if (!error || typeof error !== 'object') {
		return undefined;
	}
	const statusCode = (error as { statusCode?: unknown }).statusCode;
	return typeof statusCode === 'number' ? statusCode : undefined;
}

function resendErrorMessage(error: unknown): string {
	if (!error || typeof error !== 'object') {
		return 'Resend request failed';
	}
	const message = (error as { message?: unknown }).message;
	return typeof message === 'string' && message.trim() ? message.trim() : 'Resend request failed';
}

export function isResendSandboxRecipientError(result: SendEmailFailure): boolean {
	const message = result.reason.toLowerCase();
	return (
		message.includes('only send testing emails') ||
		message.includes('testing emails to your own') ||
		message.includes('verify a domain') ||
		(result.statusCode === 403 &&
			(message.includes('recipient') || message.includes('not allowed')))
	);
}

function sanitizeEmailErrorDetail(reason: string): string | null {
	const trimmed = reason.trim();
	if (!trimmed || trimmed === 'RESEND_API_KEY is not configured') {
		return null;
	}
	return trimmed.slice(0, 200);
}

export function householdInviteEmailWarning(result: SendEmailFailure): string | undefined {
	if (result.reason === EMAIL_SENDING_DISABLED_REASON) {
		return undefined;
	}

	const base = 'Inbjudan skapad men e-post kunde inte skickas.';

	if (result.reason === 'RESEND_API_KEY is not configured') {
		return `${base} ${missingResendKeyMessage()}`;
	}

	if (isResendSandboxRecipientError(result)) {
		return (
			`${base} I testläge (onboarding@resend.dev) kan Resend bara skicka till e-postadressen kopplad till ditt Resend-konto. ` +
			`Testa med den adressen lokalt, eller verifiera en egen domän i Resend. Mer info: ${RESEND_DOCS_URL}`
		);
	}

	if (result.statusCode === 401 || result.statusCode === 403) {
		return `${base} Resend API-nyckeln är ogiltig eller otillåten. Kontrollera RESEND_API_KEY i .env.`;
	}

	if (process.env.NODE_ENV !== 'production') {
		const detail = sanitizeEmailErrorDetail(result.reason);
		if (detail) {
			return `${base} ${detail}`;
		}
	}

	return base;
}

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
	if (isEmailSendingDisabledByEnv()) {
		console.warn(
			`[email] EMAIL_SENDING_DISABLED is set; skipped send to ${input.to}`
		);
		return { ok: false, reason: EMAIL_SENDING_DISABLED_REASON };
	}

	if (!(await appSettingsService.isEmailSendingEnabled())) {
		console.warn(`[email] Email sending is disabled in admin settings; skipped send to ${input.to}`);
		return { ok: false, reason: EMAIL_SENDING_DISABLED_REASON };
	}

	const apiKey = getResendApiKey();
	if (!apiKey) {
		const reason = 'RESEND_API_KEY is not configured';
		console.warn(`[email] ${reason}; skipped send to ${input.to}`);
		return { ok: false, reason };
	}

	console.info(`[email] Sending to ${input.to} via Resend`);
	const resend = new Resend(apiKey);
	const { data, error } = await resend.emails.send({
		from: getEmailFrom(),
		to: input.to,
		subject: input.subject,
		html: input.html,
		text: input.text
	});

	if (error) {
		const reason = resendErrorMessage(error);
		const statusCode = resendErrorStatusCode(error);
		const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
		console.error(`[email] Failed to send to ${input.to}: ${reason}${statusSuffix}`);
		return { ok: false, reason, statusCode };
	}

	console.info(`[email] Sent to ${input.to}${data?.id ? ` (id: ${data.id})` : ''}`);
	return { ok: true, id: data?.id };
}

export interface HouseholdInviteEmailContent {
	subject: string;
	html: string;
	text: string;
}

/** Brand tokens aligned with src/app.css (light theme) — inline for email client compatibility. */
const EMAIL = {
	bg: '#f7f5f0',
	surface: '#ffffff',
	surfaceMuted: '#eef2eb',
	border: '#dde5d8',
	text: '#1f2a24',
	textMuted: '#5c6b62',
	primary: '#3d6b4f',
	primaryHover: '#325a42',
	accent: '#c8a96e'
} as const;

export function buildHouseholdInviteEmailContent(options: {
	inviterName: string;
	householdName: string;
	inviteUrl: string;
	role: InviteRole;
	locale?: 'sv';
}): HouseholdInviteEmailContent {
	const { inviterName, householdName, inviteUrl, role } = options;
	const roleLabel = inviteRoleLabel(role);
	const subject = `${inviterName} bjöd in dig till ${householdName} i Skaffu`;
	const headline = `Du är inbjuden till ${householdName}`;
	const preheader = `${inviterName} bjöd in dig till Skaffu — håll koll på skafferi, datum och inköp tillsammans.`;

	const text = [
		`Hej!`,
		``,
		headline,
		``,
		`${inviterName} har bjudit in dig till hushållet "${householdName}" i Skaffu.`,
		`Skaffu hjälper er hålla koll på skafferi, utgångsdatum och inköpslistor — tillsammans i samma hushåll.`,
		`Du får rollen ${roleLabel}.`,
		``,
		`Acceptera inbjudan:`,
		inviteUrl,
		``,
		`Länken gäller i 7 dagar. Om du inte förväntade dig detta kan du ignorera mejlet.`,
		``,
		`Vänliga hälsningar,`,
		`Skaffu`
	].join('\n');

	const html = buildHouseholdInviteEmailHtml({
		headline,
		preheader,
		inviterName,
		householdName,
		inviteUrl,
		roleLabel
	});

	return { subject, html, text };
}

function buildHouseholdInviteEmailHtml(options: {
	headline: string;
	preheader: string;
	inviterName: string;
	householdName: string;
	inviteUrl: string;
	roleLabel: string;
}): string {
	const { headline, preheader, inviterName, householdName, inviteUrl, roleLabel } = options;
	const safeHeadline = escapeHtml(headline);
	const safeInviter = escapeHtml(inviterName);
	const safeHousehold = escapeHtml(householdName);
	const safeRole = escapeHtml(roleLabel);
	const safeUrl = escapeHtml(inviteUrl);
	const safePreheader = escapeHtml(preheader);

	return `<!DOCTYPE html>
<html lang="sv" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeHeadline}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.bg};font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:${EMAIL.primary};padding:28px 32px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;">
                <tr>
                  <td style="width:44px;height:44px;background-color:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.35);border-radius:12px;text-align:center;vertical-align:middle;font-size:15px;font-weight:700;letter-spacing:-0.04em;color:#ffffff;line-height:44px;">HP</td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Skaffu</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;letter-spacing:-0.02em;color:${EMAIL.text};">${safeHeadline}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${EMAIL.text};">
                <strong style="color:${EMAIL.text};">${safeInviter}</strong> har bjudit in dig till hushållet
                <strong style="color:${EMAIL.text};">${safeHousehold}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:${EMAIL.textMuted};">
                Skaffu hjälper er hålla koll på skafferi, utgångsdatum och inköpslistor — tillsammans i samma hushåll.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:${EMAIL.surfaceMuted};border:1px solid ${EMAIL.border};border-radius:999px;padding:8px 16px;">
                    <span style="font-size:13px;color:${EMAIL.textMuted};">Din roll:&nbsp;</span>
                    <strong style="font-size:13px;color:${EMAIL.primary};">${safeRole}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:${EMAIL.primary};">
                    <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${EMAIL.primary};border:1px solid ${EMAIL.primaryHover};">Acceptera inbjudan</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-top:1px solid ${EMAIL.border};">
              <p style="margin:24px 0 8px;font-size:13px;line-height:1.5;color:${EMAIL.textMuted};">
                Fungerar inte knappen? Kopiera och klistra in länken i webbläsaren:
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="${safeUrl}" style="color:${EMAIL.primary};text-decoration:underline;">${safeUrl}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                Länken gäller i 7 dagar. Om du inte förväntade dig detta kan du ignorera mejlet.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background-color:${EMAIL.surfaceMuted};border-top:1px solid ${EMAIL.border};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};text-align:center;">
                Vänliga hälsningar,<br />
                <strong style="color:${EMAIL.text};font-weight:600;">Skaffu</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface PasswordResetEmailContent {
	subject: string;
	html: string;
	text: string;
}

export function buildPasswordResetEmailContent(options: {
	resetUrl: string;
	locale?: 'sv' | 'en';
}): PasswordResetEmailContent {
	const locale = options.locale ?? 'sv';
	const isSv = locale === 'sv';
	const subject = isSv ? 'Återställ lösenord · Skaffu' : 'Reset your password · Skaffu';
	const headline = isSv ? 'Återställ ditt lösenord' : 'Reset your password';
	const preheader = isSv
		? 'Länken gäller i 1 timme och kan bara användas en gång.'
		: 'This link is valid for 1 hour and can only be used once.';
	const cta = isSv ? 'Välj nytt lösenord' : 'Choose a new password';
	const body = isSv
		? 'Vi fick en begäran om att återställa lösenordet för ditt Skaffu-konto. Om du inte begärde detta kan du ignorera mejlet.'
		: 'We received a request to reset the password for your Skaffu account. If you did not request this, you can ignore this email.';
	const footer = isSv
		? 'Länken gäller i 1 timme. Efter att du valt nytt lösenord kan den inte användas igen.'
		: 'The link is valid for 1 hour. After you set a new password it cannot be used again.';

	const text = [
		headline,
		'',
		body,
		'',
		`${cta}:`,
		options.resetUrl,
		'',
		footer,
		'',
		'Skaffu'
	].join('\n');

	const safeHeadline = escapeHtml(headline);
	const safePreheader = escapeHtml(preheader);
	const safeUrl = escapeHtml(options.resetUrl);
	const safeBody = escapeHtml(body);
	const safeFooter = escapeHtml(footer);

	const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8" /><title>${safeHeadline}</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:${EMAIL.bg};color:${EMAIL.text};">
  <div style="display:none;max-height:0;overflow:hidden;">${safePreheader}</div>
  <div style="max-width:560px;margin:0 auto;background:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:22px;">${safeHeadline}</h1>
    <p style="margin:0 0 24px;line-height:1.55;color:${EMAIL.textMuted};">${safeBody}</p>
    <p style="margin:0 0 24px;"><a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${escapeHtml(cta)}</a></p>
    <p style="margin:0;font-size:13px;color:${EMAIL.textMuted};">${safeFooter}</p>
  </div>
</body>
</html>`;

	return { subject, html, text };
}

export async function sendPasswordResetEmail(options: {
	to: string;
	resetUrl: string;
	locale?: 'sv' | 'en';
}): Promise<SendEmailResult> {
	const content = buildPasswordResetEmailContent({
		resetUrl: options.resetUrl,
		locale: options.locale
	});
	return sendEmail({
		to: options.to,
		subject: content.subject,
		html: content.html,
		text: content.text
	});
}

export async function sendHouseholdInviteEmail(options: {
	to: string;
	inviterName: string;
	householdName: string;
	inviteUrl: string;
	role: InviteRole;
	locale?: 'sv';
}): Promise<SendEmailResult> {
	const content = buildHouseholdInviteEmailContent(options);
	return sendEmail({
		to: options.to,
		subject: content.subject,
		html: content.html,
		text: content.text
	});
}

export interface ExpiryReminderEmailItem {
	name: string;
	locationLabel: string;
	expiresOnLabel: string;
	daysLeftLabel: string;
}

export interface ExpiryReminderEmailSection {
	householdName: string;
	items: ExpiryReminderEmailItem[];
}

export interface ExpiryReminderEmailContent {
	subject: string;
	html: string;
	text: string;
}

export function buildExpiryReminderEmailContent(options: {
	recipientName: string;
	days: number;
	inventoryUrl: string;
	sections: ExpiryReminderEmailSection[];
}): ExpiryReminderEmailContent {
	const { recipientName, days, inventoryUrl, sections } = options;
	const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
	const subject =
		totalItems === 1
			? '1 vara går snart ut — Skaffu'
			: `${totalItems} varor går snart ut — Skaffu`;
	const headline =
		totalItems === 1 ? '1 vara går snart ut' : `${totalItems} varor går snart ut`;
	const preheader = `Hej ${recipientName}! Här är varor som går ut inom ${days} dagar.`;

	const textSections = sections
		.map((section) => {
			const lines = section.items.map(
				(item) =>
					`- ${item.name} (${item.locationLabel}) — ${item.expiresOnLabel}, ${item.daysLeftLabel}`
			);
			return [`${section.householdName}:`, ...lines].join('\n');
		})
		.join('\n\n');

	const text = [
		`Hej ${recipientName}!`,
		``,
		headline,
		``,
		`Följande varor i ditt hushåll går ut inom ${days} dagar:`,
		``,
		textSections,
		``,
		`Öppna skafferiet:`,
		inventoryUrl,
		``,
		`Du får det här mejlet eftersom du aktiverat utgångspåminnelser i Skaffu. Stäng av dem under Inställningar.`,
		``,
		`Vänliga hälsningar,`,
		`Skaffu`
	].join('\n');

	const html = buildExpiryReminderEmailHtml({
		headline,
		preheader,
		recipientName,
		days,
		inventoryUrl,
		sections
	});

	return { subject, html, text };
}

function buildExpiryReminderEmailHtml(options: {
	headline: string;
	preheader: string;
	recipientName: string;
	days: number;
	inventoryUrl: string;
	sections: ExpiryReminderEmailSection[];
}): string {
	const { headline, preheader, recipientName, days, inventoryUrl, sections } = options;
	const safeHeadline = escapeHtml(headline);
	const safePreheader = escapeHtml(preheader);
	const safeName = escapeHtml(recipientName);
	const safeUrl = escapeHtml(inventoryUrl);

	const sectionBlocks = sections
		.map((section) => {
			const safeHousehold = escapeHtml(section.householdName);
			const rows = section.items
				.map((item) => {
					const safeName = escapeHtml(item.name);
					const safeLocation = escapeHtml(item.locationLabel);
					const safeExpiry = escapeHtml(item.expiresOnLabel);
					const safeDaysLeft = escapeHtml(item.daysLeftLabel);
					return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL.border};">
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${EMAIL.text};">${safeName}</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL.textMuted};">${safeLocation} · ${safeExpiry} · <strong style="color:${EMAIL.accent};">${safeDaysLeft}</strong></p>
  </td>
</tr>`;
				})
				.join('');
			return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td style="padding:0 0 8px;">
      <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL.textMuted};">${safeHousehold}</p>
    </td>
  </tr>
  ${rows}
</table>`;
		})
		.join('');

	return `<!DOCTYPE html>
<html lang="sv" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <title>${safeHeadline}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL.bg};font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:${EMAIL.primary};padding:28px 32px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;">
                <tr>
                  <td style="width:44px;height:44px;background-color:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.35);border-radius:12px;text-align:center;vertical-align:middle;font-size:15px;font-weight:700;letter-spacing:-0.04em;color:#ffffff;line-height:44px;">HP</td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Skaffu</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;color:${EMAIL.text};">${safeHeadline}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${EMAIL.text};">
                Hej <strong>${safeName}</strong>! Här är varor som går ut inom <strong>${days} dagar</strong>.
              </p>
              ${sectionBlocks}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:${EMAIL.primary};">
                    <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${EMAIL.primary};">Öppna skafferiet</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-top:1px solid ${EMAIL.border};">
              <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                Du får det här mejlet eftersom du aktiverat utgångspåminnelser i Skaffu. Stäng av dem under Inställningar.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background-color:${EMAIL.surfaceMuted};border-top:1px solid ${EMAIL.border};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};text-align:center;">
                Vänliga hälsningar,<br />
                <strong style="color:${EMAIL.text};font-weight:600;">Skaffu</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendExpiryReminderEmail(options: {
	to: string;
	recipientName: string;
	days: number;
	sections: ExpiryReminderEmailSection[];
	inventoryUrl?: string;
}): Promise<SendEmailResult> {
	const inventoryUrl = options.inventoryUrl ?? `${getAppOrigin()}/hem`;
	const content = buildExpiryReminderEmailContent({
		recipientName: options.recipientName,
		days: options.days,
		inventoryUrl,
		sections: options.sections
	});
	return sendEmail({
		to: options.to,
		subject: content.subject,
		html: content.html,
		text: content.text
	});
}

/**
 * Owner PMF weekly digest — bypasses EMAIL_SENDING_DISABLED and admin email toggle.
 * Only sends when PMF_DIGEST_TO is configured and matches `input.to` (cron-only path).
 */
export async function sendOwnerPmfDigest(input: SendEmailInput): Promise<SendEmailResult> {
	const allowedTo = getPmfDigestTo();
	if (!allowedTo) {
		const reason = 'PMF_DIGEST_TO is not configured';
		console.warn(`[email] ${reason}; skipped PMF digest`);
		return { ok: false, reason };
	}

	if (input.to !== allowedTo) {
		const reason = 'PMF digest recipient does not match PMF_DIGEST_TO';
		console.warn(`[email] ${reason}; skipped send to ${input.to}`);
		return { ok: false, reason };
	}

	const apiKey = getResendApiKey();
	if (!apiKey) {
		const reason = 'RESEND_API_KEY is not configured';
		console.warn(`[email] ${reason}; skipped PMF digest to ${input.to}`);
		return { ok: false, reason };
	}

	console.info(
		`[email] Sending PMF digest to ${input.to} via Resend (bypasses EMAIL_SENDING_DISABLED)`
	);
	const resend = new Resend(apiKey);
	const { data, error } = await resend.emails.send({
		from: getEmailFrom(),
		to: input.to,
		subject: input.subject,
		html: input.html,
		text: input.text
	});

	if (error) {
		const reason = resendErrorMessage(error);
		const statusCode = resendErrorStatusCode(error);
		const statusSuffix = statusCode ? ` (HTTP ${statusCode})` : '';
		console.error(`[email] Failed to send PMF digest to ${input.to}: ${reason}${statusSuffix}`);
		return { ok: false, reason, statusCode };
	}

	console.info(`[email] PMF digest sent to ${input.to}${data?.id ? ` (id: ${data.id})` : ''}`);
	return { ok: true, id: data?.id };
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
