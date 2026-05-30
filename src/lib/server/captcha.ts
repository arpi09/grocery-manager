import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const CAPTCHA_VERIFY_FAILED_MESSAGE = 'Captcha verifierades inte. Försök igen.';
export const CAPTCHA_NOT_CONFIGURED_MESSAGE =
	'Captcha är inte konfigurerad. Kontakta administratören.';

export type TurnstileVerifyResult = { ok: true } | { ok: false; message: string };

interface TurnstileVerifyResponse {
	success: boolean;
	'error-codes'?: string[];
}

export function getTurnstileSecretKey(): string | null {
	const key = env.TURNSTILE_SECRET_KEY?.trim();
	return key ? key : null;
}

export function isTurnstileSkipEnabled(): boolean {
	return env.TURNSTILE_SKIP?.trim().toLowerCase() === 'true';
}

/** Public site key for the register widget; empty when skip is enabled or key is missing. */
export function getTurnstileSiteKeyForClient(): string {
	if (isTurnstileSkipEnabled()) {
		return '';
	}
	const key = publicEnv.PUBLIC_TURNSTILE_SITE_KEY?.trim();
	return key ? key : '';
}

function isProduction(): boolean {
	return env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
}

export async function verifyTurnstileToken(
	token: string,
	remoteIp?: string
): Promise<TurnstileVerifyResult> {
	if (isTurnstileSkipEnabled()) {
		if (isProduction()) {
			console.error('[turnstile] TURNSTILE_SKIP is set in production — bypass ignored');
		} else {
			console.warn('[turnstile] Skipping verification (TURNSTILE_SKIP=true)');
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
		return { ok: false, message: CAPTCHA_NOT_CONFIGURED_MESSAGE };
	}

	if (!token.trim()) {
		return { ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE };
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
		return { ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE };
	}

	let payload: TurnstileVerifyResponse;
	try {
		payload = (await response.json()) as TurnstileVerifyResponse;
	} catch {
		console.error('[turnstile] Verification returned unreadable JSON');
		return { ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE };
	}

	if (!response.ok || !payload.success) {
		const codes = payload['error-codes']?.join(', ') ?? 'unknown';
		console.warn(`[turnstile] Verification failed: ${codes}`);
		return { ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE };
	}

	return { ok: true };
}
