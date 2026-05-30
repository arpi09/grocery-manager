import type { Cookies } from '@sveltejs/kit';
import { isLocale, LOCALE_COOKIE_NAME, type Locale } from '$lib/i18n/locale';

export function readLocaleCookie(cookies: Cookies): Locale | null {
	const value = cookies.get(LOCALE_COOKIE_NAME);
	if (!value || !isLocale(value)) {
		return null;
	}
	return value;
}

export function writeLocaleCookie(cookies: Cookies, locale: Locale): void {
	cookies.set(LOCALE_COOKIE_NAME, locale, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: false,
		sameSite: 'lax'
	});
}
