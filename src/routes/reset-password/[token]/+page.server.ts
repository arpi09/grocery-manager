import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { hashSecureToken, verifySecureToken } from '$lib/infrastructure/auth/secure-token';
import { translate } from '$lib/i18n/messages';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { createSession } from '$lib/server/session';
import { resetPasswordSchema } from '$lib/validation/auth.schemas';
import { passwordResetRepository } from '$lib/server/di';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const tokenHash = hashSecureToken(params.token);
	const row = await passwordResetRepository.findValidByTokenHash(tokenHash);
	const tokenValid = Boolean(row && verifySecureToken(params.token, row.tokenHash));

	return {
		tokenValid,
		canonicalUrl: marketingCanonicalUrl(`/reset-password/${params.token}`, url.origin)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const token = event.params.token;
		const formData = Object.fromEntries(await event.request.formData());
		const parsed = resetPasswordSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors
			});
		}

		const result = await event.locals.passwordResetService.resetPassword(
			token,
			parsed.data.password
		);

		if (!result.ok) {
			return fail(400, {
				errors: {},
				message: translate(event.locals.locale, 'auth.resetPassword.invalidToken')
			});
		}

		await createSession(event, result.userId);

		redirect(302, APP_HOME_PATH);
	}
};
