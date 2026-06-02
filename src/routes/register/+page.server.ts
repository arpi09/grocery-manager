import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { isAuthError } from '$lib/application/auth.service';
import {
	getTurnstileSiteKeyForClient,
	isTurnstileRequiredForRegistration,
	verifyTurnstileToken,
	warnIfTurnstileMisconfigured
} from '$lib/server/captcha';
import { translate } from '$lib/i18n/messages';
import {
	LANDING_VARIANT_COOKIE,
	resolveLandingVariant
} from '$lib/marketing/landing-variants';
import { env as publicEnv } from '$env/dynamic/public';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { recordSignupCompleteEvent } from '$lib/server/marketing-analytics';
import { registerSchema } from '$lib/validation/auth.schemas';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { createSession } from '$lib/server/session';
import { isGoogleOAuthConfigured } from '$lib/server/google-oauth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	warnIfTurnstileMisconfigured('register load');

	return {
		turnstileSiteKey: getTurnstileSiteKeyForClient(),
		captchaRequired: isTurnstileRequiredForRegistration(),
		googleOAuthEnabled: isGoogleOAuthConfigured(),
		canonicalUrl: marketingCanonicalUrl('/register', url.origin)
	};
};

export const actions: Actions = {
	register: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parsed = registerSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors,
				message: 'Please fix the errors below.',
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

		try {
			const user = await event.locals.authService.register(
				parsed.data.email,
				parsed.data.password
			);
			const analyticsAllowed = hasAnalyticsConsent(readCookieConsent(event.cookies));
			const variant = resolveLandingVariant({
				cookieVariant: event.cookies.get(LANDING_VARIANT_COOKIE),
				envVariant: publicEnv.PUBLIC_LANDING_VARIANT,
				allowVariantCookie: analyticsAllowed
			});
			recordSignupCompleteEvent(
				event.locals.pmfService,
				user.id,
				variant,
				analyticsAllowed ? getOrSetAnalyticsVisitorId(event.cookies) : null
			);
			await createSession(event, user.id);
		} catch (error) {
			if (isAuthError(error)) {
				return fail(400, {
					errors: {},
					message: error.message,
					email: parsed.data.email
				});
			}
			throw error;
		}

		redirect(302, `${APP_HOME_PATH}?freshAccount=1`);
	}
};
