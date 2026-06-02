import { env } from '$env/dynamic/private';
import { Google } from 'arctic';
import { generateId } from '$lib/infrastructure/auth/id';
import { getAppOrigin } from '$lib/server/origin';

const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

export function getGoogleClientId(): string | null {
	const value = env.GOOGLE_CLIENT_ID?.trim();
	return value ? value : null;
}

export function getGoogleClientSecret(): string | null {
	const value = env.GOOGLE_CLIENT_SECRET?.trim();
	return value ? value : null;
}

export function isGoogleOAuthConfigured(): boolean {
	return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function createGoogleClient(): Google | null {
	const clientId = getGoogleClientId();
	const clientSecret = getGoogleClientSecret();
	if (!clientId || !clientSecret) {
		return null;
	}

	return new Google(clientId, clientSecret, `${getAppOrigin()}/auth/google/callback`);
}

export function createGoogleAuthorizationUrl(state: string, codeVerifier: string): string | null {
	const google = createGoogleClient();
	if (!google) {
		return null;
	}

	const url = google.createAuthorizationURL(state, codeVerifier, GOOGLE_SCOPES);
	url.searchParams.set('prompt', 'select_account');
	return url.toString();
}

export function createOAuthState(): string {
	return generateId();
}

export { GOOGLE_SCOPES };
