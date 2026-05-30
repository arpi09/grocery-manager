import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { requireUser } from '$lib/server/api-guards';
import {
	missingIngredientToListItem,
	parseMissingIngredientsPayload
} from '$lib/server/recipe-prompt';
import { translate } from '$lib/i18n/messages';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdRole || !canEditInventory(locals.householdRole)) {
		return json({ error: translate(locale, 'scan.readonly') }, { status: 403 });
	}

	const householdId = locals.householdId;
	if (!householdId) {
		return json({ error: translate(locale, 'errors.household.noHousehold') }, { status: 400 });
	}

	const body = await request.json().catch(() => ({}));
	const ingredients = parseMissingIngredientsPayload(body);
	if (ingredients.length === 0) {
		return json({ error: translate(locale, 'recipe.noMissingToAdd') }, { status: 400 });
	}

	const result = await locals.shoppingListService.addSuggestedItems(
		householdId,
		locals.householdRole!,
		ingredients.map(missingIngredientToListItem)
	);

	return json({
		added: result.added,
		skipped: result.skipped
	});
};
