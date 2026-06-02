import { createGoogleClient, getGoogleClientId } from '$lib/server/google-oauth';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { POST_REGISTER_SCAN_OAUTH_REDIRECT } from '$lib/navigation/post-register';
import { createSession } from '$lib/server/session';
import { recordSignupCompleteEvent } from '$lib/server/marketing-analytics';
import {
	LANDING_VARIANT_COOKIE,
	resolveLandingVariant
} from '$lib/marketing/landing-variants';
import { env as publicEnv } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const STATE_COOKIE = 'google_oauth_state';
const VERIFIER_COOKIE = 'google_oauth_verifier';
const REDIRECT_COOKIE = 'google_oauth_redirect';

function loginError(message: string) {
	return redirect(302, `/login?message=${encodeURIComponent(message)}`);
}

export const GET: RequestHandler = async (event) => {
	const { url, cookies, locals } = event;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STATE_COOKIE);
	const codeVerifier = cookies.get(VERIFIER_COOKIE);
	const redirectTo = cookies.get(REDIRECT_COOKIE);

	cookies.delete(STATE_COOKIE, { path: '/' });
	cookies.delete(VERIFIER_COOKIE, { path: '/' });
	cookies.delete(REDIRECT_COOKIE, { path: '/' });

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		return loginError('Google sign-in failed. Please try again.');
	}

	const google = createGoogleClient();
	const clientId = getGoogleClientId();
	if (!google || !clientId) {
		return loginError('Google sign-in is not configured');
	}

	let isNewUser = false;

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const idToken = tokens.idToken();
		const result = await locals.oauthService.resolveGoogleUser(idToken, clientId);

		if (!result.ok) {
			return loginError('Google sign-in failed. Please try again.');
		}

		isNewUser = result.isNewUser;

		if (result.isNewUser) {
			const analyticsAllowed = hasAnalyticsConsent(readCookieConsent(cookies));
			const variant = resolveLandingVariant({
				cookieVariant: cookies.get(LANDING_VARIANT_COOKIE),
				envVariant: publicEnv.PUBLIC_LANDING_VARIANT,
				allowVariantCookie: analyticsAllowed
			});
			recordSignupCompleteEvent(
				locals.pmfService,
				result.userId,
				variant,
				analyticsAllowed ? getOrSetAnalyticsVisitorId(cookies) : null
			);
		}

		await createSession(event, result.userId);
	} catch {
		return loginError('Google sign-in failed. Please try again.');
	}

	const destination =
		redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
			? redirectTo
			: isNewUser
				? POST_REGISTER_SCAN_OAUTH_REDIRECT
				: APP_HOME_PATH;
	const freshAccountSuffix = isNewUser
		? `${destination.includes('?') ? '&' : '?'}freshAccount=1`
		: '';
	redirect(302, `${destination}${freshAccountSuffix}`);
};
