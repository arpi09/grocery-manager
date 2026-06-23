import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { runPantryFixBatch } from '$lib/server/brain-pantry-fix';
import { learningFeedbackRepository } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId || !locals.householdRole || !canEditInventory(locals.householdRole)) {
		return json({ error: translate(locale, 'scan.readonly') }, { status: 403 });
	}

	const body = (await request.json().catch(() => ({}))) as {
		inferExpiry?: unknown;
		suggestMerges?: unknown;
	};

	const apiKeyOrResponse = requireOpenAiKey(locale, 'pantry fix', 503);
	const apiKey = typeof apiKeyOrResponse === 'string' ? apiKeyOrResponse : null;

	const result = await runPantryFixBatch({
		householdId: locals.householdId,
		actorRole: locals.householdRole,
		inventoryService: locals.inventoryService,
		apiKey,
		learningFeedbackRepository,
		inferExpiry: body.inferExpiry !== false,
		suggestMerges: body.suggestMerges !== false
	});

	return json({ fix: result });
};
