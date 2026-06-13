import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { postVerifyWelcomePath } from '$lib/navigation/email-verification';
import { createSession } from '$lib/server/session';
import { translate } from '$lib/i18n/messages';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeRedirect(value: string | null): string | null {
	if (value && value.startsWith('/') && !value.startsWith('//')) {
		return value;
	}
	return null;
}

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
		const redirectTo = safeRedirect(event.cookies.get('post_register_redirect') ?? null);
		if (redirectTo) {
			event.cookies.delete('post_register_redirect', { path: '/' });
			redirect(302, redirectTo);
		}
		redirect(302, postVerifyWelcomePath());
	}
};
