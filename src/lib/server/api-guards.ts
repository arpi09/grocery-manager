import { json } from '@sveltejs/kit';
import { getOpenAiApiKey, missingOpenAiKeyMessage } from '$lib/server/openai';

type AuthenticatedLocals = App.Locals & { user: NonNullable<App.Locals['user']> };

export type RequireUserResult =
	| { authorized: false; response: Response }
	| { authorized: true; user: NonNullable<App.Locals['user']> };

/** Returns a 401 JSON response when the session user is missing. */
export function requireUser(locals: App.Locals): RequireUserResult {
	if (!locals.user) {
		return {
			authorized: false,
			response: json({ error: 'Unauthorized' }, { status: 401 })
		};
	}
	return { authorized: true, user: locals.user };
}

/**
 * Returns a JSON response when OPENAI_API_KEY is unset.
 * Status defaults to 500; product-from-image uses 503.
 */
export function requireOpenAiKey(feature: string, status: 500 | 503 = 500) {
	const apiKey = getOpenAiApiKey();
	if (!apiKey) {
		return json({ error: missingOpenAiKeyMessage(feature) }, { status });
	}
	return apiKey;
}

export type { AuthenticatedLocals };
