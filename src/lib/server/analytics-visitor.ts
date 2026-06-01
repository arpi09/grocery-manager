import type { Cookies } from '@sveltejs/kit';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { generateId } from '$lib/infrastructure/auth/id';

/** Anonymous visitor id for pre-signup product_event rows (stored in metadata). */
export const ANALYTICS_VISITOR_COOKIE = 'hp_analytics_visitor';

export const ANALYTICS_VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

export function getAnalyticsVisitorId(cookies: Cookies): string | null {
	const existing = cookies.get(ANALYTICS_VISITOR_COOKIE)?.trim();
	return existing || null;
}

/** Returns visitor id only when analytics consent is `all`; never sets cookies without consent. */
export function getOrSetAnalyticsVisitorId(cookies: Cookies): string | null {
	if (!hasAnalyticsConsent(readCookieConsent(cookies))) {
		return null;
	}

	const existing = getAnalyticsVisitorId(cookies);
	if (existing) {
		return existing;
	}

	const visitorId = generateId();
	cookies.set(ANALYTICS_VISITOR_COOKIE, visitorId, {
		path: '/',
		maxAge: ANALYTICS_VISITOR_MAX_AGE,
		httpOnly: false,
		sameSite: 'lax'
	});
	return visitorId;
}
