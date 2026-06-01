import type { Cookies } from '@sveltejs/kit';
import { generateId } from '$lib/infrastructure/auth/id';

/** Anonymous visitor id for pre-signup product_event rows (stored in metadata). */
export const ANALYTICS_VISITOR_COOKIE = 'hp_analytics_visitor';

export const ANALYTICS_VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

export function getOrSetAnalyticsVisitorId(cookies: Cookies): string {
	const existing = cookies.get(ANALYTICS_VISITOR_COOKIE)?.trim();
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
