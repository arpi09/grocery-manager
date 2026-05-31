import { isAuthError } from '$lib/application/auth.service';
import {
	SIGNUP_UTM_COOKIE,
	SIGNUP_UTM_COOKIE_MAX_AGE,
	hasSignupUtm,
	resolveSignupUtm,
	serializeSignupUtmCookie
} from '$lib/marketing/signup-utm';
	import {
		getTurnstileSiteKeyForClient,
		isTurnstileRequiredForRegistration,
		verifyTurnstileToken,
		warnIfTurnstileMisconfigured
	} from '$lib/server/captcha';
import { translate } from '$lib/i18n/messages';
import { registerSchema } from '$lib/validation/auth.schemas';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { createSession } from '$lib/server/session';
import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function persistSignupUtmCookie(
	cookies: Cookies,
	url: URL,
	cookieValue: string | undefined
) {
	const utm = resolveSignupUtm({
		searchParams: url.searchParams,
		cookieValue
	});
	if (!hasSignupUtm(utm)) {
		return;
	}
	cookies.set(SIGNUP_UTM_COOKIE, serializeSignupUtmCookie(utm), {
		path: '/',
		maxAge: SIGNUP_UTM_COOKIE_MAX_AGE,
		httpOnly: true,
		sameSite: 'lax'
	});
}

export const load: PageServerLoad = async ({ url, cookies }) => {
	persistSignupUtmCookie(cookies, url, cookies.get(SIGNUP_UTM_COOKIE));

	warnIfTurnstileMisconfigured('register load');

	return {
		turnstileSiteKey: getTurnstileSiteKeyForClient(),
		captchaRequired: isTurnstileRequiredForRegistration()
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

		const signupUtm = resolveSignupUtm({
			searchParams: event.url.searchParams,
			cookieValue: event.cookies.get(SIGNUP_UTM_COOKIE)
		});

		try {
			const user = await event.locals.authService.register(
				parsed.data.email,
				parsed.data.password,
				signupUtm
			);
			await createSession(event, user.id);
			event.cookies.delete(SIGNUP_UTM_COOKIE, { path: '/' });
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

		redirect(302, APP_HOME_PATH);
	}
};
