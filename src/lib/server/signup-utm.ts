import type { Cookies } from '@sveltejs/kit';
import type { SignupUtm } from '$lib/domain/signup-utm';
import {
	parseSignupUtmFromSearchParams,
	resolveSignupUtm,
	serializeSignupUtmCookie,
	SIGNUP_UTM_COOKIE,
	SIGNUP_UTM_COOKIE_MAX_AGE
} from '$lib/marketing/signup-utm';

export function persistSignupUtmCookie(cookies: Cookies, searchParams: URLSearchParams): void {
	const utm = parseSignupUtmFromSearchParams(searchParams);
	if (!utm) {
		return;
	}

	cookies.set(SIGNUP_UTM_COOKIE, serializeSignupUtmCookie(utm), {
		path: '/',
		maxAge: SIGNUP_UTM_COOKIE_MAX_AGE,
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	});
}

export function resolveSignupUtmFromRequest(
	cookies: Cookies,
	searchParams: URLSearchParams
): SignupUtm | null {
	return resolveSignupUtm({
		searchParams,
		cookieValue: cookies.get(SIGNUP_UTM_COOKIE)
	});
}

export function clearSignupUtmCookie(cookies: Cookies): void {
	cookies.delete(SIGNUP_UTM_COOKIE, { path: '/' });
}
