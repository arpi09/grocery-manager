export const LOCALES = ['sv', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'sv';

export const LOCALE_STORAGE_KEY = 'home-pantry-locale';

export const LOCALE_COOKIE_NAME = 'home-pantry-locale';

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

/** Parse Accept-Language; returns sv/en when strongly preferred, otherwise null. */
export function resolveLocaleFromAcceptLanguage(header: string | null): Locale | null {
	if (!header) {
		return null;
	}

	let best: { locale: Locale; quality: number } | null = null;

	for (const part of header.split(',')) {
		const [tag, ...params] = part.trim().split(';');
		const base = tag.trim().toLowerCase().split('-')[0];
		if (base !== 'sv' && base !== 'en') {
			continue;
		}

		let quality = 1;
		for (const param of params) {
			const qMatch = param.trim().match(/^q=([0-9.]+)$/);
			if (qMatch) {
				quality = Number.parseFloat(qMatch[1]);
			}
		}

		const locale = base as Locale;
		if (!best || quality > best.quality) {
			best = { locale, quality };
		}
	}

	return best?.locale ?? null;
}
