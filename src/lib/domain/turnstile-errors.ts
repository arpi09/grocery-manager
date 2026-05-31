import type { MessageKey } from '$lib/i18n/messages';

/** Cloudflare Turnstile: hostname not on the widget allowlist. */
export const TURNSTILE_INVALID_DOMAIN_CODE = '110200';

export function getTurnstileLoadErrorMessageKey(errorCode?: string): MessageKey {
	if (errorCode === TURNSTILE_INVALID_DOMAIN_CODE) {
		return 'auth.register.captchaDomainError';
	}
	return 'auth.register.captchaLoadError';
}
