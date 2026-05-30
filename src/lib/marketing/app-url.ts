import { env as publicEnv } from '$env/dynamic/public';

const DEFAULT_APP_URL = 'https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app';

/** Canonical app origin for marketing CTAs (login/register). */
export function resolveAppOrigin(requestOrigin?: string): string {
	const configured = publicEnv.PUBLIC_APP_URL?.trim();
	if (configured) {
		return configured.replace(/\/$/, '');
	}
	if (requestOrigin) {
		return requestOrigin.replace(/\/$/, '');
	}
	return DEFAULT_APP_URL;
}

export function appLoginUrl(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	if (requestOrigin && origin === requestOrigin.replace(/\/$/, '')) {
		return '/login';
	}
	return `${origin}/login`;
}

export function appRegisterUrl(requestOrigin?: string): string {
	const origin = resolveAppOrigin(requestOrigin);
	if (requestOrigin && origin === requestOrigin.replace(/\/$/, '')) {
		return '/register';
	}
	return `${origin}/register`;
}
