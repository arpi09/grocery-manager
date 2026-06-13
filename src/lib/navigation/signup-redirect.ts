import type { Cookies } from '@sveltejs/kit';

import { APP_HOME_PATH } from './app-home';
import { postVerifyWelcomePath } from './email-verification';

export const SIGNUP_REDIRECT_COOKIE = 'signup_redirect';

/** Lista / shopping-share signup passes household invite intent via redirect query. */
export const HOUSEHOLD_SETTINGS_REDIRECT = '/settings#household';

const SIGNUP_REDIRECT_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge: 60 * 60
};

export function safeSignupRedirect(value: string | null | undefined): string | null {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return null;
	}
	return value;
}

export function isHouseholdSettingsRedirect(redirect: string | null | undefined): boolean {
	if (!redirect) {
		return false;
	}
	const [pathname, hash] = redirect.split('#');
	return pathname === '/settings' && (!hash || hash === 'household');
}

/** Post-verify landing: shared-list signups see inköp first, not settings. */
export function resolvePostVerifyLanding(redirect: string | null | undefined): string {
	const safe = safeSignupRedirect(redirect);
	if (!safe || isHouseholdSettingsRedirect(safe)) {
		return postVerifyWelcomePath();
	}
	return safe;
}

/** OAuth / skip-enforcement signup — pathname only (query params added by callback). */
export function resolvePostSignupAppPath(redirect: string | null | undefined): string {
	const safe = safeSignupRedirect(redirect);
	if (!safe || isHouseholdSettingsRedirect(safe)) {
		return APP_HOME_PATH;
	}
	const [pathname] = safe.split(/[?#]/);
	return pathname || APP_HOME_PATH;
}

export function persistSignupRedirect(cookies: Cookies, redirect: string | null | undefined): void {
	const safe = safeSignupRedirect(redirect);
	if (!safe) {
		return;
	}
	cookies.set(SIGNUP_REDIRECT_COOKIE, safe, SIGNUP_REDIRECT_COOKIE_OPTIONS);
}

export function peekSignupRedirect(cookies: Cookies): string | null {
	return safeSignupRedirect(cookies.get(SIGNUP_REDIRECT_COOKIE));
}

export function consumeSignupRedirect(cookies: Cookies): string | null {
	const redirect = peekSignupRedirect(cookies);
	cookies.delete(SIGNUP_REDIRECT_COOKIE, { path: '/' });
	return redirect;
}
