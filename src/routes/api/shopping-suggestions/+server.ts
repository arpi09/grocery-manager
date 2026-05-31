import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { e2eMockShoppingSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { generateShoppingSuggestions } from '$lib/server/shopping-suggestions';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as {
		preferences?: unknown;
		householdSize?: unknown;
	};

	const result = isE2eMockAiEnabled()
		? e2eMockShoppingSuggestions()
		: await (async () => {
				const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'shopping suggestions');
				if (typeof apiKeyOrResponse !== 'string') {
					return apiKeyOrResponse;
				}

				const quotaResponse = await requireAiQuota(locals, 'smart_fill', auth.user.id);
				if (quotaResponse) {
					return quotaResponse;
				}

				return generateShoppingSuggestions(
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
			})();

	if (result instanceof Response) {
		return result;
	}

	if (!result.ok) {
		return json(
			{ error: translate(locals.locale, result.messageKey) },
			{ status: result.status }
		);
	}

	return json({
		items: result.items,
		note: result.note,
		generatedAt: new Date().toISOString()
	});
};
