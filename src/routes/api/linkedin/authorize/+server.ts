import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/auth';
import {
	createLinkedInAuthorizationUrl,
	createLinkedInOAuthState,
	isLinkedInApiConfigured
} from '$lib/server/linkedin-oauth';
import type { RequestHandler } from './$types';

const STATE_COOKIE = 'linkedin_oauth_state';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user || !isAdmin(locals.user)) {
		redirect(302, '/login');
	}

	if (!isLinkedInApiConfigured()) {
		redirect(302, '/admin?tab=social&linkedin=not_configured');
	}

	const state = createLinkedInOAuthState();
	const authUrl = createLinkedInAuthorizationUrl(state);
	if (!authUrl) {
		redirect(302, '/admin?tab=social&linkedin=not_configured');
	}

	cookies.set(STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 10
	});

	redirect(302, authUrl);
};
