import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { isAuthError } from '$lib/application/auth.service';
import { loginSchema } from '$lib/validation/auth.schemas';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { createSession } from '$lib/server/session';
import { isGoogleOAuthConfigured } from '$lib/server/google-oauth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_PER_IP = 30;
const MAX_LOGIN_PER_EMAIL = 10;

function safeRedirect(value: string | null): string | null {
	if (value && value.startsWith('/') && !value.startsWith('//')) {
		return value;
	}
	return null;
}

export const load: PageServerLoad = async ({ url }) => ({
	message: url.searchParams.get('message'),
	redirectTo: safeRedirect(url.searchParams.get('redirect')),
	googleOAuthEnabled: isGoogleOAuthConfigured(),
	canonicalUrl: marketingCanonicalUrl('/login', url.origin)
});

export const actions: Actions = {
	login: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parsed = loginSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors,
				message: 'Please fix the errors below.',
				email: String(formData.email ?? ''),
				redirectTo: safeRedirect(String(formData.redirectTo ?? ''))
			});
		}

		const redirectTo = safeRedirect(String(formData.redirectTo ?? ''));
		const clientIp = event.getClientAddress();
		const emailKey = `login:email:${parsed.data.email.trim().toLowerCase()}`;
		const ipKey = `login:ip:${clientIp}`;

		if (
			!consumeRateLimit(ipKey, MAX_LOGIN_PER_IP, LOGIN_WINDOW_MS) ||
			!consumeRateLimit(emailKey, MAX_LOGIN_PER_EMAIL, LOGIN_WINDOW_MS)
		) {
			return fail(429, {
				errors: {},
				message: 'Too many login attempts. Please try again later.',
				email: parsed.data.email,
				redirectTo
			});
		}

		try {
			const user = await event.locals.authService.login(parsed.data.email, parsed.data.password);
			await createSession(event, user.id);
		} catch (error) {
			if (isAuthError(error)) {
				return fail(400, {
					errors: {},
					message: error.message,
					email: parsed.data.email,
					redirectTo
				});
			}
			throw error;
		}

		redirect(302, redirectTo ?? APP_HOME_PATH);
	}
};
