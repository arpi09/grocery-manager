import { generateCodeVerifier, generateState } from 'arctic';
import { createGoogleAuthorizationUrl, isGoogleOAuthConfigured } from '$lib/server/google-oauth';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const STATE_COOKIE = 'google_oauth_state';
const VERIFIER_COOKIE = 'google_oauth_verifier';
const REDIRECT_COOKIE = 'google_oauth_redirect';

function safeRedirect(value: string | null): string | null {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return null;
	}
	return value;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!isGoogleOAuthConfigured()) {
		redirect(302, '/login?message=' + encodeURIComponent('Google sign-in is not configured'));
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = createGoogleAuthorizationUrl(state, codeVerifier);
	if (!authUrl) {
		redirect(302, '/login?message=' + encodeURIComponent('Google sign-in is not configured'));
	}

	const redirectTo = safeRedirect(url.searchParams.get('redirectTo'));
	const cookieOptions = {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		maxAge: 60 * 10
	};

	cookies.set(STATE_COOKIE, state, cookieOptions);
	cookies.set(VERIFIER_COOKIE, codeVerifier, cookieOptions);
	if (redirectTo) {
		cookies.set(REDIRECT_COOKIE, redirectTo, cookieOptions);
	}

	redirect(302, authUrl);
};
