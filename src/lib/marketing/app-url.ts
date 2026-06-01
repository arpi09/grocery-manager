import { env as publicEnv } from '$env/dynamic/public';

/** Dev/SSR fallback when PUBLIC_ORIGIN is unset — production must set PUBLIC_ORIGIN (see apphosting.yaml). */
const DEFAULT_APP_URL = 'http://localhost:5173';

function trimOrigin(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed.replace(/\/$/, '') : undefined;
}

/** Canonical app origin for marketing CTAs (login/register). */
export function resolveAppOrigin(requestOrigin?: string): string {
	const configuredAppUrl = trimOrigin(publicEnv.PUBLIC_APP_URL);
	if (configuredAppUrl) {
		return configuredAppUrl;
	}

	const publicOrigin = trimOrigin(publicEnv.PUBLIC_ORIGIN);
	if (publicOrigin) {
		return publicOrigin;
	}

	const request = trimOrigin(requestOrigin);
	if (request) {
		return request;
	}

	return DEFAULT_APP_URL;
}

/** Absolute canonical URL for marketing pages (SEO og:url, link rel=canonical). */
export function marketingCanonicalUrl(pathname: string, requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	const path = pathname === '/' ? '' : pathname.replace(/\/$/, '');
	return `${origin}${path}`;
}

export function appLoginUrl(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	if (requestOrigin && origin === trimOrigin(requestOrigin)) {
		return '/login';
	}
	return `${origin}/login`;
}

export function appRegisterUrl(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	if (requestOrigin && origin === trimOrigin(requestOrigin)) {
		return '/register';
	}
	return `${origin}/register`;
}
