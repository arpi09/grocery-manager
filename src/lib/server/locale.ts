import type { Cookies } from '@sveltejs/kit';
import {
	DEFAULT_LOCALE,
	resolveLocaleFromAcceptLanguage,
	type Locale
} from '$lib/i18n/locale';
import { readLocaleCookie } from '$lib/infrastructure/locale-cookie';

export function resolveLocaleForRequest(cookies: Cookies, request: Request): Locale {
	const fromCookie = readLocaleCookie(cookies);
	if (fromCookie) {
		return fromCookie;
	}

	const fromAccept = resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'));
	if (fromAccept) {
		return fromAccept;
	}

	return DEFAULT_LOCALE;
}
