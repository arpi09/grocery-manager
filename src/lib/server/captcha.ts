import { PUBLIC_TURNSTILE_SITE_KEY as staticTurnstileSiteKey } from '$env/static/public';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';
import type { MessageKey } from '$lib/i18n/messages';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Cloudflare dummy keys — always pass; any hostname. See docs/CAPTCHA.md */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

export const CAPTCHA_FAILED_KEY = 'captcha.failed' satisfies MessageKey;
export const CAPTCHA_NOT_CONFIGURED_KEY = 'captcha.notConfigured' satisfies MessageKey;

export type TurnstileVerifyResult = { ok: true } | { ok: false; messageKey: MessageKey };

interface TurnstileVerifyResponse {
	success: boolean;
	'error-codes'?: string[];
}

export function getTurnstileSecretKey(): string | null {
	const key = env.TURNSTILE_SECRET_KEY?.trim();
	return key ? key : null;
}

function isTruthyEnvFlag(value: string | undefined): boolean {
	return value?.trim().toLowerCase() === 'true';
}

/** Skip Turnstile in non-production when TURNSTILE_SKIP or TURNSTILE_BYPASS is true (E2E/CI). */
export function isTurnstileSkipEnabled(): boolean {
	return (
		isTruthyEnvFlag(env.TURNSTILE_SKIP) || isTruthyEnvFlag(env.TURNSTILE_BYPASS)
	);
}

/** Registration expects Turnstile unless CI/local bypass is enabled (always required in production). */
export function isTurnstileRequiredForRegistration(): boolean {
	if (isProduction()) {
		return true;
	}
	return !isTurnstileSkipEnabled();
}

function resolveTurnstileSiteKey(): string {
	const key = (
		staticTurnstileSiteKey ||
		publicEnv.PUBLIC_TURNSTILE_SITE_KEY ||
		process.env.PUBLIC_TURNSTILE_SITE_KEY
	)?.trim();
	return key ? key : '';
}

/** Public site key for the register widget; empty when skip is enabled (non-prod only) or key is missing. */
export function getTurnstileSiteKeyForClient(): string {
	if (!isProduction() && isTurnstileSkipEnabled()) {
		return '';
	}
	return resolveTurnstileSiteKey();
}

function isProduction(): boolean {
	return env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
}

/** Log once per request when prod register loads without a site key. */
export function warnIfTurnstileMisconfigured(context: string): void {
	if (!isProduction() || !isTurnstileRequiredForRegistration()) {
		return;
	}
	if (!resolveTurnstileSiteKey()) {
		console.error(
			`[turnstile] PUBLIC_TURNSTILE_SITE_KEY missing (${context}) — widget hidden on /register`
		);
	}
}

export async function verifyTurnstileToken(
	token: string,
	remoteIp?: string
): Promise<TurnstileVerifyResult> {
	if (isTurnstileSkipEnabled()) {
		if (isProduction()) {
			console.error('[turnstile] TURNSTILE_SKIP/TURNSTILE_BYPASS is set in production — bypass ignored');
		} else {
			console.warn('[turnstile] Skipping verification (TURNSTILE_SKIP/TURNSTILE_BYPASS)');
			return { ok: true };
		}
	}

	const secret = getTurnstileSecretKey();
	if (!secret) {
		if (isProduction()) {
			console.error('[turnstile] TURNSTILE_SECRET_KEY is missing in production');
		} else {
			console.warn(
				'[turnstile] TURNSTILE_SECRET_KEY is missing — set TURNSTILE_SKIP=true for local dev'
			);
		}
		return { ok: false, messageKey: CAPTCHA_NOT_CONFIGURED_KEY };
	}

	if (!token.trim()) {
		return { ok: false, messageKey: CAPTCHA_FAILED_KEY };
	}

	let response: Response;
	try {
		const body = new URLSearchParams();
		body.set('secret', secret);
		body.set('response', token);
		if (remoteIp) {
			body.set('remoteip', remoteIp);
		}

		response = await fetch(TURNSTILE_VERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'network error';
		console.error(`[turnstile] Verification request failed: ${detail}`);
		return { ok: false, messageKey: CAPTCHA_FAILED_KEY };
	}

	let payload: TurnstileVerifyResponse;
	try {
		payload = (await response.json()) as TurnstileVerifyResponse;
	} catch {
		console.error('[turnstile] Verification returned unreadable JSON');
		return { ok: false, messageKey: CAPTCHA_FAILED_KEY };
	}

	if (!response.ok || !payload.success) {
		const codes = payload['error-codes']?.join(', ') ?? 'unknown';
		const hint =
			codes.includes('invalid-input-secret') || codes.includes('missing-input-secret')
				? ' — check TURNSTILE_SECRET_KEY matches the widget'
				: codes.includes('invalid-input-response')
					? ' — token missing/expired or site key mismatch'
					: '';
		console.warn(`[turnstile] Verification failed: ${codes}${hint}`);
		return { ok: false, messageKey: CAPTCHA_FAILED_KEY };
	}

	return { ok: true };
}
