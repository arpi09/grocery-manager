import { browser } from '$app/environment';
import {
	DEFAULT_LOCALE,
	LOCALE_STORAGE_KEY,
	isLocale,
	type Locale
} from './locale';
import { translate, type MessageKey } from './messages';

let currentLocale = $state<Locale>(DEFAULT_LOCALE);

export function getLocale(): Locale {
	return currentLocale;
}

function writeClientLocaleCookie(locale: Locale): void {
	document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function setLocale(locale: Locale): void {
	if (locale === currentLocale) {
		return;
	}

	currentLocale = locale;

	if (!browser) {
		return;
	}

	localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	writeClientLocaleCookie(locale);
	document.documentElement.lang = locale;
}

/** Apply locale from SSR layout data (cookie). Server locale wins over any stale client storage. */
export function initLocale(serverLocale: Locale): void {
	if (!isLocale(serverLocale)) {
		return;
	}

	currentLocale = serverLocale;

	if (!browser) {
		return;
	}

	localStorage.setItem(LOCALE_STORAGE_KEY, serverLocale);
	writeClientLocaleCookie(serverLocale);
	document.documentElement.lang = serverLocale;
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
	const _locale = currentLocale;
	return translate(_locale, key, params);
}
