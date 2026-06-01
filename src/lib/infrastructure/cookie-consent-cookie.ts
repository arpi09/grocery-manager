import type { Cookies } from '@sveltejs/kit';
import {
	COOKIE_CONSENT_MAX_AGE,
	COOKIE_CONSENT_NAME,
	parseCookieConsent,
	type CookieConsentChoice
} from '$lib/cookie-consent';
import { ANALYTICS_VISITOR_COOKIE } from '$lib/server/analytics-visitor';
import { LANDING_VARIANT_COOKIE } from '$lib/marketing/landing-variants';

const LANDING_VIEW_SESSION_COOKIE = 'hp_landing_view_sent';

export function readCookieConsent(cookies: Cookies): CookieConsentChoice | null {
	return parseCookieConsent(cookies.get(COOKIE_CONSENT_NAME));
}

export function writeCookieConsent(cookies: Cookies, choice: CookieConsentChoice): void {
	cookies.set(COOKIE_CONSENT_NAME, choice, {
		path: '/',
		maxAge: COOKIE_CONSENT_MAX_AGE,
		httpOnly: false,
		sameSite: 'lax'
	});
}

export function clearNonEssentialAnalyticsCookies(cookies: Cookies): void {
	cookies.delete(ANALYTICS_VISITOR_COOKIE, { path: '/' });
	cookies.delete(LANDING_VARIANT_COOKIE, { path: '/' });
	cookies.delete(LANDING_VIEW_SESSION_COOKIE, { path: '/' });
}
