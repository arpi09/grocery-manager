import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import { inviteRoleLabel, type InviteRole } from '$lib/domain/household';

const DEFAULT_FROM = 'Home Pantry <onboarding@resend.dev>';
const RESEND_DOCS_URL = 'https://resend.com/docs/send-with-nextjs';

export function getResendApiKey(): string | null {
	const key = env.RESEND_API_KEY?.trim();
	return key ? key : null;
}

export function getEmailFrom(): string {
	const from = env.RESEND_FROM?.trim();
	return from || DEFAULT_FROM;
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

export function householdInviteEmailWarning(result: SendEmailFailure): string {
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
	locale?: 'sv';
}): HouseholdInviteEmailContent {
	const { inviterName, householdName, inviteUrl, role } = options;
	const roleLabel = inviteRoleLabel(role);
	const subject = `${inviterName} bjöd in dig till ${householdName} i Home Pantry`;

	const text = [
		`Hej!`,
		``,
		`${inviterName} har bjudit in dig till hushållet "${householdName}" i Home Pantry.`,
		`Du får rollen ${roleLabel}.`,
		``,
		`Acceptera inbjudan här:`,
		inviteUrl,
		``,
		`Länken gäller i 7 dagar. Om du inte förväntade dig detta kan du ignorera mejlet.`,
		``,
		`Vänliga hälsningar,`,
		`Home Pantry`
	].join('\n');

	const html = `<!DOCTYPE html>
<html lang="sv">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
  <p>Hej!</p>
  <p><strong>${escapeHtml(inviterName)}</strong> har bjudit in dig till hushållet <strong>${escapeHtml(householdName)}</strong> i Home Pantry.</p>
  <p>Du får rollen <strong>${escapeHtml(roleLabel)}</strong>.</p>
  <p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:0.65rem 1rem;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Acceptera inbjudan</a></p>
  <p style="font-size:0.9rem;color:#555;">Eller kopiera länken: <a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>
  <p style="font-size:0.85rem;color:#666;">Länken gäller i 7 dagar. Om du inte förväntade dig detta kan du ignorera mejlet.</p>
  <p style="font-size:0.85rem;color:#666;">Vänliga hälsningar,<br>Home Pantry</p>
</body>
</html>`;

	return { subject, html, text };
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

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
