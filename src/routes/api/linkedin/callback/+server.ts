import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/auth';
import { appendActionToast } from '$lib/utils/action-toast';
import {
	exchangeLinkedInAuthorizationCode,
	isLinkedInApiConfigured
} from '$lib/server/linkedin-oauth';
import type { RequestHandler } from './$types';

const STATE_COOKIE = 'linkedin_oauth_state';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	if (!locals.user || !isAdmin(locals.user)) {
		redirect(302, '/login');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STATE_COOKIE);
	const error = url.searchParams.get('error');

	cookies.delete(STATE_COOKIE, { path: '/' });

	if (error) {
		redirect(302, appendActionToast('/admin?tab=social', 'adminLinkedInConnectFailed', error));
	}

	if (!code || !state || !storedState || state !== storedState) {
		redirect(302, appendActionToast('/admin?tab=social', 'adminLinkedInConnectFailed'));
	}

	if (!isLinkedInApiConfigured()) {
		redirect(302, '/admin?tab=social&linkedin=not_configured');
	}

	try {
		const tokens = await exchangeLinkedInAuthorizationCode(code);
		await locals.linkedInPublishService.storeOAuthTokens(tokens);
		redirect(302, appendActionToast('/admin?tab=social', 'adminLinkedInConnected'));
	} catch {
		redirect(302, appendActionToast('/admin?tab=social', 'adminLinkedInConnectFailed'));
	}
};
