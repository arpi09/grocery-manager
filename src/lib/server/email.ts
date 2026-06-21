import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { inviteRoleLabel, type InviteRole } from '$lib/domain/household';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { getAppOrigin } from '$lib/server/origin';
import {
	EMAIL_SENDING_DISABLED_REASON,
	isEmailSendingDisabledByEnv
} from '$lib/application/app-settings.service';
import { appSettingsService } from '$lib/server/di';
import {
	EMAIL,
	buildBrandedEmailHtml,
	escapeEmailHtml
} from '$lib/server/email-layout';

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

/** Owner prod error alert recipient — falls back to PMF_DIGEST_TO. */
export function getErrorAlertTo(): string | null {
	const to = env.ERROR_ALERT_TO?.trim();
	if (to) {
		return to;
	}
	return getPmfDigestTo();
}

export function missingResendKeyMessage(locale: Locale = 'sv'): string {
	return translate(locale, 'email.inviteWarning.missingApiKey');
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

export function householdInviteEmailWarning(
	locale: Locale,
	result: SendEmailFailure
): string | undefined {
	if (result.reason === EMAIL_SENDING_DISABLED_REASON) {
		return translate(locale, 'email.inviteWarning.envDisabled');
	}

	const base = translate(locale, 'email.inviteWarning.base');

	if (result.reason === 'RESEND_API_KEY is not configured') {
		return `${base} ${missingResendKeyMessage(locale)}`;
	}

	if (isResendSandboxRecipientError(result)) {
		return translate(locale, 'email.inviteWarning.sandbox', { docsUrl: RESEND_DOCS_URL });
	}

	if (result.statusCode === 401 || result.statusCode === 403) {
		return translate(locale, 'email.inviteWarning.apiKey');
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

export function buildHouseholdInviteEmailContent(options: {
	inviterName: string;
	householdName: string;
	inviteUrl: string;
	role: InviteRole;
	locale?: 'sv' | 'en';
}): HouseholdInviteEmailContent {
	const locale = options.locale ?? 'sv';
	const { inviterName, householdName, inviteUrl, role } = options;
	const roleLabel = inviteRoleLabel(role, locale);
	const subject = translate(locale, 'email.templates.invite.subject', {
		inviterName,
		householdName
	});
	const headline = translate(locale, 'email.templates.invite.headline', { householdName });
	const preheader = translate(locale, 'email.templates.invite.preheader', { inviterName });
	const productLead = translate(locale, 'email.templates.invite.productLead');

	const text = [
		translate(locale, 'email.templates.invite.textGreeting'),
		'',
		headline,
		'',
		translate(locale, 'email.templates.invite.textInvited', { inviterName, householdName }),
		productLead,
		translate(locale, 'email.templates.invite.textRole', { roleLabel }),
		'',
		translate(locale, 'email.templates.invite.textAccept'),
		inviteUrl,
		'',
		translate(locale, 'email.templates.invite.expiryNote'),
		'',
		translate(locale, 'email.templates.common.signOff'),
		'Skaffu'
	].join('\n');

	const html = buildHouseholdInviteEmailHtml({
		headline,
		preheader,
		inviterName,
		householdName,
		inviteUrl,
		roleLabel,
		productLead,
		locale
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
	productLead: string;
	locale: 'sv' | 'en';
}): string {
	const {
		headline,
		preheader,
		inviterName,
		householdName,
		inviteUrl,
		roleLabel,
		productLead,
		locale
	} = options;
	const invitedBody = translate(locale, 'email.templates.invite.invitedBody');
	const rolePrefix = translate(locale, 'email.templates.invite.rolePrefix');
	const cta = translate(locale, 'email.templates.invite.cta');
	const linkHelp = translate(locale, 'email.templates.invite.linkHelp');
	const expiryNote = translate(locale, 'email.templates.invite.expiryNote');
	const safeHeadline = escapeEmailHtml(headline);
	const safeInviter = escapeEmailHtml(inviterName);
	const safeHousehold = escapeEmailHtml(householdName);
	const safeRole = escapeEmailHtml(roleLabel);

	const bodyHtml = `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;letter-spacing:-0.02em;color:${EMAIL.text};">${safeHeadline}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${EMAIL.text};">
                <strong style="color:${EMAIL.text};">${safeInviter}</strong> ${escapeEmailHtml(invitedBody)}
                <strong style="color:${EMAIL.text};">${safeHousehold}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:${EMAIL.textMuted};">
                ${escapeEmailHtml(productLead)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:${EMAIL.surfaceMuted};border:1px solid ${EMAIL.border};border-radius:999px;padding:8px 16px;">
                    <span style="font-size:13px;color:${EMAIL.textMuted};">${escapeEmailHtml(rolePrefix)}&nbsp;</span>
                    <strong style="font-size:13px;color:${EMAIL.primary};">${safeRole}</strong>
                  </td>
                </tr>
              </table>`;

	const footerHtml = `<p style="margin:24px 0 8px;font-size:13px;line-height:1.5;color:${EMAIL.textMuted};">
                ${escapeEmailHtml(linkHelp)}
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="${escapeEmailHtml(inviteUrl)}" style="color:${EMAIL.primary};text-decoration:underline;">${escapeEmailHtml(inviteUrl)}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                ${escapeEmailHtml(expiryNote)}
              </p>`;

	return buildBrandedEmailHtml({
		locale,
		preheader,
		title: headline,
		bodyHtml,
		cta: { label: cta, href: inviteUrl },
		footerHtml
	});
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
	const subject = translate(locale, 'email.templates.reset.subject');
	const headline = translate(locale, 'email.templates.reset.headline');
	const preheader = translate(locale, 'email.templates.reset.preheader');
	const cta = translate(locale, 'email.templates.reset.cta');
	const body = translate(locale, 'email.templates.reset.body');
	const footer = translate(locale, 'email.templates.reset.footer');

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

	const bodyHtml = `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;color:${EMAIL.text};">${escapeEmailHtml(headline)}</h1>
    <p style="margin:0 0 24px;line-height:1.55;color:${EMAIL.textMuted};">${escapeEmailHtml(body)}</p>`;
	const footerHtml = `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${EMAIL.textMuted};">${escapeEmailHtml(footer)}</p>`;

	const html = buildBrandedEmailHtml({
		locale,
		preheader,
		title: headline,
		bodyHtml,
		cta: { label: cta, href: options.resetUrl },
		footerHtml
	});

	return { subject, html, text };
}

export interface EmailVerificationEmailContent {
	subject: string;
	html: string;
	text: string;
}

export function buildEmailVerificationEmailContent(options: {
	verifyUrl: string;
	locale?: 'sv' | 'en';
}): EmailVerificationEmailContent {
	const locale = options.locale ?? 'sv';
	const subject = translate(locale, 'email.templates.verify.subject');
	const headline = translate(locale, 'email.templates.verify.headline');
	const preheader = translate(locale, 'email.templates.verify.preheader');
	const cta = translate(locale, 'email.templates.verify.cta');
	const body = translate(locale, 'email.templates.verify.body');
	const footer = translate(locale, 'email.templates.verify.footer');

	const text = [headline, '', body, '', `${cta}:`, options.verifyUrl, '', footer, '', 'Skaffu'].join(
		'\n'
	);

	const bodyHtml = `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;color:${EMAIL.text};">${escapeEmailHtml(headline)}</h1>
    <p style="margin:0 0 24px;line-height:1.55;color:${EMAIL.textMuted};">${escapeEmailHtml(body)}</p>`;
	const footerHtml = `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${EMAIL.textMuted};">${escapeEmailHtml(footer)}</p>`;

	const html = buildBrandedEmailHtml({
		locale,
		preheader,
		title: headline,
		bodyHtml,
		cta: { label: cta, href: options.verifyUrl },
		footerHtml
	});

	return { subject, html, text };
}

export async function sendEmailVerificationEmail(options: {
	to: string;
	verifyUrl: string;
	locale?: 'sv' | 'en';
}): Promise<SendEmailResult> {
	const content = buildEmailVerificationEmailContent({ verifyUrl: options.verifyUrl, locale: options.locale });
	return sendEmail({ to: options.to, subject: content.subject, html: content.html, text: content.text });
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
	locale?: 'sv' | 'en';
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
	locale?: 'sv' | 'en';
}): ExpiryReminderEmailContent {
	const locale = options.locale ?? 'sv';
	const { recipientName, days, inventoryUrl, sections } = options;
	const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
	const subject =
		totalItems === 1
			? translate(locale, 'email.templates.expiry.subjectOne')
			: translate(locale, 'email.templates.expiry.subjectMany', { count: totalItems });
	const headline =
		totalItems === 1
			? translate(locale, 'email.templates.expiry.headlineOne')
			: translate(locale, 'email.templates.expiry.headlineMany', { count: totalItems });
	const preheader = translate(locale, 'email.templates.expiry.preheader', {
		name: recipientName,
		headline
	});
	const cta = translate(locale, 'email.templates.expiry.cta');
	const inboundLead = translate(locale, 'weeklyRitual.inboundEmailLead', { count: totalItems });

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
		translate(locale, 'email.templates.expiry.textGreeting', { name: recipientName }),
		'',
		headline,
		'',
		translate(locale, 'email.templates.expiry.textLead', { days }),
		'',
		textSections,
		'',
		inboundLead,
		inventoryUrl,
		'',
		translate(locale, 'email.templates.expiry.footer'),
		'',
		translate(locale, 'email.templates.common.signOff'),
		'Skaffu'
	].join('\n');

	const html = buildExpiryReminderEmailHtml({
		headline,
		preheader,
		recipientName,
		days,
		inventoryUrl,
		sections,
		cta,
		locale
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
	cta: string;
	locale: 'sv' | 'en';
}): string {
	const { headline, preheader, recipientName, days, inventoryUrl, sections, cta, locale } = options;
	const intro = translate(locale, 'email.templates.expiry.intro', {
		name: recipientName,
		days
	});
	const footer = translate(locale, 'email.templates.expiry.footer');
	const safeHeadline = escapeEmailHtml(headline);

	const sectionBlocks = sections
		.map((section) => {
			const safeHousehold = escapeEmailHtml(section.householdName);
			const rows = section.items
				.map((item) => {
					const safeItemName = escapeEmailHtml(item.name);
					const safeLocation = escapeEmailHtml(item.locationLabel);
					const safeExpiry = escapeEmailHtml(item.expiresOnLabel);
					const safeDaysLeft = escapeEmailHtml(item.daysLeftLabel);
					return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL.border};">
    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:${EMAIL.text};">${safeItemName}</p>
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

	const bodyHtml = `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.25;color:${EMAIL.text};">${safeHeadline}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${EMAIL.text};">
                ${escapeEmailHtml(intro)}
              </p>
              ${sectionBlocks}`;

	const footerHtml = `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                ${escapeEmailHtml(footer)}
              </p>`;

	return buildBrandedEmailHtml({
		locale,
		preheader,
		title: headline,
		bodyHtml,
		cta: { label: cta, href: inventoryUrl },
		footerHtml
	});
}

export async function sendExpiryReminderEmail(options: {
	to: string;
	recipientName: string;
	days: number;
	sections: ExpiryReminderEmailSection[];
	inventoryUrl?: string;
	locale?: 'sv' | 'en';
}): Promise<SendEmailResult> {
	const inventoryUrl = options.inventoryUrl ?? `${getAppOrigin()}/hem`;
	const content = buildExpiryReminderEmailContent({
		recipientName: options.recipientName,
		days: options.days,
		inventoryUrl,
		sections: options.sections,
		locale: options.locale
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

/**
 * Owner prod error alert — bypasses EMAIL_SENDING_DISABLED and admin email toggle.
 * Only sends when ERROR_ALERT_TO (or PMF_DIGEST_TO) is configured and matches `input.to`.
 */
export async function sendOwnerErrorAlert(input: SendEmailInput): Promise<SendEmailResult> {
	const allowedTo = getErrorAlertTo();
	if (!allowedTo) {
		const reason = 'ERROR_ALERT_TO / PMF_DIGEST_TO is not configured';
		console.warn(`[email] ${reason}; skipped error alert`);
		return { ok: false, reason };
	}

	if (input.to !== allowedTo) {
		const reason = 'Error alert recipient does not match configured owner address';
		console.warn(`[email] ${reason}; skipped send to ${input.to}`);
		return { ok: false, reason };
	}

	const apiKey = getResendApiKey();
	if (!apiKey) {
		const reason = 'RESEND_API_KEY is not configured';
		console.warn(`[email] ${reason}; skipped error alert to ${input.to}`);
		return { ok: false, reason };
	}

	console.info(`[email] Sending error alert to ${input.to} via Resend`);
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
		console.error(`[email] Failed to send error alert to ${input.to}: ${reason}${statusSuffix}`);
		return { ok: false, reason, statusCode };
	}

	console.info(`[email] Error alert sent to ${input.to}${data?.id ? ` (id: ${data.id})` : ''}`);
	return { ok: true, id: data?.id };
}
