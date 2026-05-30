import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

/** Items expiring within this many days appear on the home dashboard ("Går ut snart"). */
export const EXPIRING_SOON_DAYS = 7;

export function daysUntilExpiry(expiresOn: string, today = new Date()): number {
	const [year, month, day] = expiresOn.split('-').map(Number);
	const expires = new Date(year, month - 1, day);
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.round((expires.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysLeft(days: number, locale: Locale = DEFAULT_LOCALE): string {
	if (days <= 0) return translate(locale, 'expiry.today');
	if (days === 1) return translate(locale, 'expiry.oneDayLeft');
	return translate(locale, 'expiry.daysLeft', { count: days });
}

/** @deprecated Use formatDaysLeft with locale */
export function formatDaysLeftSv(days: number): string {
	return formatDaysLeft(days, 'sv');
}

export function formatExpiryDate(
	expiresOn: string,
	locale: Locale = DEFAULT_LOCALE
): string {
	const [year, month, day] = expiresOn.split('-').map(Number);
	const tag = locale === 'sv' ? 'sv-SE' : 'en-GB';
	return new Intl.DateTimeFormat(tag, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(year, month - 1, day));
}

/** @deprecated Use formatExpiryDate with locale */
export function formatExpiryDateSv(expiresOn: string): string {
	return formatExpiryDate(expiresOn, 'sv');
}
