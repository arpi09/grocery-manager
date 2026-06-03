import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import {
	getTurnstileSiteKeyForClient,
	isTurnstileRequiredForRegistration,
	verifyTurnstileToken,
	warnIfTurnstileMisconfigured
} from '$lib/server/captcha';
import { translate } from '$lib/i18n/messages';
import { forgotPasswordSchema } from '$lib/validation/auth.schemas';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const GENERIC_SUCCESS_KEY = 'auth.forgotPassword.success';

export const load: PageServerLoad = async ({ url }) => {
	warnIfTurnstileMisconfigured('forgot-password load');

	return {
		turnstileSiteKey: getTurnstileSiteKeyForClient(),
		captchaRequired: isTurnstileRequiredForRegistration(),
		canonicalUrl: marketingCanonicalUrl('/forgot-password', url.origin)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parsed = forgotPasswordSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors,
				email: String(formData.email ?? '')
			});
		}

		const captchaToken = String(formData['cf-turnstile-response'] ?? '');
		const captcha = await verifyTurnstileToken(captchaToken, event.getClientAddress());
		if (!captcha.ok) {
			return fail(400, {
				errors: {},
				message: translate(event.locals.locale, captcha.messageKey),
				email: parsed.data.email
			});
		}

		const emailLocale = event.locals.locale === 'en' ? 'en' : 'sv';
		await event.locals.passwordResetService.requestReset(
			parsed.data.email,
			event.getClientAddress(),
			emailLocale
		);

		return {
			success: true,
			message: translate(event.locals.locale, GENERIC_SUCCESS_KEY),
			email: parsed.data.email
		};
	}
};
