import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { generateShoppingSuggestions } from '$lib/server/shopping-suggestions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey('shopping suggestions');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}

	const body = (await request.json().catch(() => ({}))) as {
		preferences?: unknown;
		householdSize?: unknown;
	};

	const result = await generateShoppingSuggestions(
		{
			apiKey: apiKeyOrResponse,
			householdId: locals.householdId!,
			userId: auth.user.id,
			inventoryService: locals.inventoryService,
			mealPlanService: locals.mealPlanService
		},
		{
			preferences: typeof body.preferences === 'string' ? body.preferences : undefined,
			householdSize: typeof body.householdSize === 'number' ? body.householdSize : undefined
		}
	);

	if (!result.ok) {
		if (result.message === 'parse_failed') {
			return json(
				{ error: translate(locals.locale, 'errors.api.suggestionsFailed') },
				{ status: 502 }
			);
		}
		return json({ error: result.message }, { status: result.status });
	}

	return json({
		items: result.items,
		note: result.note,
		generatedAt: new Date().toISOString()
	});
};
