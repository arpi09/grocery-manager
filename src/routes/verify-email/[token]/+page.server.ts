import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import {
	consumeSignupRedirect,
	isHouseholdSettingsRedirect,
	peekSignupRedirect,
	resolvePostVerifyLanding
} from '$lib/navigation/signup-redirect';
import { createSession } from '$lib/server/session';
import { translate } from '$lib/i18n/messages';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url, cookies }) => ({
	tokenValid: await locals.emailVerificationService.isTokenValid(params.token),
	householdInviteIntent: isHouseholdSettingsRedirect(peekSignupRedirect(cookies)),
	canonicalUrl: marketingCanonicalUrl(`/verify-email/${params.token}`, url.origin)
});

export const actions: Actions = {
	default: async (event) => {
		const result = await event.locals.emailVerificationService.completeSignupVerification(
			event.params.token
		);
		if (!result.ok) {
			return fail(400, {
				message: translate(event.locals.locale, 'auth.verifyEmail.invalidToken')
			});
		}
		await createSession(event, result.userId);
		const redirectTo = consumeSignupRedirect(event.cookies);
		redirect(302, resolvePostVerifyLanding(redirectTo));
	}
};
