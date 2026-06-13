import { marketingCanonicalUrl } from '$lib/marketing/app-url';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeRedirect(value: string | null): string | null {
	if (value && value.startsWith('/') && !value.startsWith('//')) {
		return value;
	}
	return null;
}

function resolvePostVerifyDestination(
	url: URL,
	cookies: import('@sveltejs/kit').Cookies
): string {
	const redirectTo = safeRedirect(
		url.searchParams.get('redirect') ?? cookies.get('post_register_redirect') ?? null
	);
	if (redirectTo) {
		cookies.delete('post_register_redirect', { path: '/' });
		return redirectTo;
	}
	return `${APP_HOME_PATH}?welcome=1`;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	return {
		email: locals.user?.email ?? null,
		canonicalUrl: marketingCanonicalUrl('/verify-email', url.origin)
	};
};

export const actions: Actions = {
	resend: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		await event.locals.emailVerificationService.resendVerification(
			event.locals.user.id,
			event.getClientAddress(),
			event.locals.locale
		);

		return { success: true };
	},
	continue: async (event) => {
		if (!event.locals.user?.emailVerifiedAt) {
			return fail(400, { message: 'Email not verified' });
		}
		redirect(302, resolvePostVerifyDestination(event.url, event.cookies));
	}
};
