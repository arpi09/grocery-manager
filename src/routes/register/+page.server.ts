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
import {
	clearSignupUtmCookie,
	resolveSignupUtmFromRequest
} from '$lib/server/signup-utm';
import { registerSchema } from '$lib/validation/auth.schemas';
import { POST_REGISTER_APP_HOME_PATH, POST_REGISTER_SCAN_PATH } from '$lib/navigation/post-register';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { isEmailVerificationSkipped } from '$lib/server/email-verification-enforcement';
import { createSession } from '$lib/server/session';
import { isGoogleOAuthConfigured } from '$lib/server/google-oauth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeRedirect(value: string | null): string | null {
	if (value && value.startsWith('/') && !value.startsWith('//')) {
		return value;
	}
	return null;
}

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
				message: translate(event.locals.locale, 'auth.login.fixErrorsBelow'),
				email: String(formData.email ?? '')
			});
		}

		const clientIp = event.getClientAddress();
		if (!consumeRateLimit(`register:ip:${clientIp}`, 10, 15 * 60 * 1000)) {
			return fail(429, {
				errors: {},
				message: translate(event.locals.locale, 'auth.register.rateLimited'),
				email: parsed.data.email
			});
		}

		const captchaToken = String(formData['cf-turnstile-response'] ?? '');
		const captcha = await verifyTurnstileToken(captchaToken, clientIp);
		if (!captcha.ok) {
			return fail(400, {
				errors: {},
				message: translate(event.locals.locale, captcha.messageKey),
				email: parsed.data.email
			});
		}

		try {
			const signupUtm = resolveSignupUtmFromRequest(event.cookies, event.url.searchParams);
			const user = await event.locals.authService.register(
				parsed.data.email,
				parsed.data.password,
				signupUtm
			);
			const analyticsAllowed = hasAnalyticsConsent(readCookieConsent(event.cookies));
			const variant = resolveLandingVariant({
				cookieVariant: event.cookies.get(LANDING_VARIANT_COOKIE),
				envVariant: publicEnv.PUBLIC_LANDING_VARIANT,
				allowVariantCookie: analyticsAllowed
			});
			recordSignupCompleteEvent(event.locals.pmfService, user.id, variant, {
				visitorId: analyticsAllowed ? getOrSetAnalyticsVisitorId(event.cookies) : null,
				signupUtm
			});
			clearSignupUtmCookie(event.cookies);
			await createSession(event, user.id);
			const redirectTo = safeRedirect(event.url.searchParams.get('redirect'));
			if (redirectTo) {
				event.cookies.set('post_register_redirect', redirectTo, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24
				});
			}
			const emailLocale = event.locals.locale === 'en' ? 'en' : 'sv';
			await event.locals.emailVerificationService.sendSignupVerification(user.id, emailLocale);
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

		const redirectTo = safeRedirect(event.url.searchParams.get('redirect'));
		const verifyDestination = redirectTo
			? `${POST_REGISTER_SCAN_PATH}?redirect=${encodeURIComponent(redirectTo)}`
			: POST_REGISTER_SCAN_PATH;

		redirect(
			302,
			isEmailVerificationSkipped() ? POST_REGISTER_APP_HOME_PATH : verifyDestination
		);
	}
};
