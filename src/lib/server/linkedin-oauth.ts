import { env } from '$env/dynamic/private';
import { generateId } from '$lib/infrastructure/auth/id';
import { getAppOrigin } from '$lib/server/origin';

export const LINKEDIN_OAUTH_SCOPES = ['w_organization_social', 'r_organization_social'] as const;

const LINKEDIN_AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

export function getLinkedInClientId(): string | null {
	const value = env.LINKEDIN_CLIENT_ID?.trim();
	return value ? value : null;
}

export function getLinkedInClientSecret(): string | null {
	const value = env.LINKEDIN_CLIENT_SECRET?.trim();
	return value ? value : null;
}

export function getLinkedInOrganizationId(): string | null {
	const value = env.LINKEDIN_ORGANIZATION_ID?.trim();
	return value ? value : null;
}

export function isLinkedInApiConfigured(): boolean {
	return Boolean(
		getLinkedInClientId() && getLinkedInClientSecret() && getLinkedInOrganizationId()
	);
}

export function getLinkedInRedirectUri(): string {
	return `${getAppOrigin()}/api/linkedin/callback`;
}

export function createLinkedInOAuthState(): string {
	return generateId();
}

export function createLinkedInAuthorizationUrl(state: string): string | null {
	const clientId = getLinkedInClientId();
	if (!clientId) {
		return null;
	}

	const url = new URL(LINKEDIN_AUTHORIZE_URL);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', getLinkedInRedirectUri());
	url.searchParams.set('state', state);
	url.searchParams.set('scope', LINKEDIN_OAUTH_SCOPES.join(' '));
	return url.toString();
}

export interface LinkedInTokenResponse {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	refresh_token_expires_in?: number;
	scope?: string;
}

export async function exchangeLinkedInAuthorizationCode(
	code: string
): Promise<LinkedInTokenResponse> {
	const clientId = getLinkedInClientId();
	const clientSecret = getLinkedInClientSecret();
	if (!clientId || !clientSecret) {
		throw new Error('LinkedIn OAuth is not configured');
	}

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: getLinkedInRedirectUri(),
		client_id: clientId,
		client_secret: clientSecret
	});

	const response = await fetch(LINKEDIN_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`LinkedIn token exchange failed (${response.status}): ${detail}`);
	}

	return (await response.json()) as LinkedInTokenResponse;
}

export async function refreshLinkedInAccessToken(
	refreshToken: string
): Promise<LinkedInTokenResponse> {
	const clientId = getLinkedInClientId();
	const clientSecret = getLinkedInClientSecret();
	if (!clientId || !clientSecret) {
		throw new Error('LinkedIn OAuth is not configured');
	}

	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: clientId,
		client_secret: clientSecret
	});

	const response = await fetch(LINKEDIN_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`LinkedIn token refresh failed (${response.status}): ${detail}`);
	}

	return (await response.json()) as LinkedInTokenResponse;
}
