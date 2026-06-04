import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { postVerifyWelcomePath } from '$lib/navigation/email-verification';
import { createSession } from '$lib/server/session';
import { translate } from '$lib/i18n/messages';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => ({
	tokenValid: await locals.emailVerificationService.isTokenValid(params.token),
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
		redirect(302, postVerifyWelcomePath());
	}
};
