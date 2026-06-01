import { json } from '@sveltejs/kit';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { isAdmin } from '$lib/server/auth';
import { getOpenAiApiKey, OPENAI_NOT_CONFIGURED_KEY } from '$lib/server/openai';

type AuthenticatedLocals = App.Locals & { user: NonNullable<App.Locals['user']> };

export type RequireUserResult =
	| { authorized: false; response: Response }
	| { authorized: true; user: NonNullable<App.Locals['user']> };

/** Returns a 401 JSON response when the session user is missing. */
export function requireUser(locals: App.Locals): RequireUserResult {
	if (!locals.user) {
		return {
			authorized: false,
			response: json(
				{ error: translate(locals.locale, 'errors.api.unauthorized') },
				{ status: 401 }
			)
		};
	}
	return { authorized: true, user: locals.user };
}

/** Returns 401/403 JSON when the session user is missing or not admin. */
export function requireAdmin(locals: App.Locals): RequireUserResult {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth;
	}
	if (!isAdmin(auth.user)) {
		return {
			authorized: false,
			response: json(
				{ error: translate(locals.locale, 'errors.api.unauthorized') },
				{ status: 403 }
			)
		};
	}
	return auth;
}

/**
 * Returns a JSON response when OPENAI_API_KEY is unset.
 * Status defaults to 500; product-from-image uses 503.
 */
export function requireOpenAiKey(locale: Locale, _feature: string, status: 500 | 503 = 500) {
	const apiKey = getOpenAiApiKey();
	if (!apiKey) {
		return json({ error: translate(locale, OPENAI_NOT_CONFIGURED_KEY) }, { status });
	}
	return apiKey;
}

export type { AuthenticatedLocals };
