import { canEditInventory } from '$lib/domain/household';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import {
	ShoppingListNotFoundError,
	ShoppingListReadOnlyError
} from '$lib/application/shopping-list.service';
import { parseAddShoppingListItem } from '$lib/validation/shopping-list.schemas';
import { translate } from '$lib/i18n/messages';
import { getOpenAiApiKey, missingOpenAiKeyMessage } from '$lib/server/openai';
import {
	generateShoppingSuggestions,
	suggestionToListItem
} from '$lib/server/shopping-suggestions';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const householdId = locals.householdId;
	if (!householdId) {
		return { user, items: [], canEdit: false };
	}

	const items = await locals.shoppingListService.listItems(householdId);
	return {
		user,
		items,
		canEdit: !!locals.householdRole && canEditInventory(locals.householdRole)
	};
};

function handleServiceError(err: unknown) {
	if (err instanceof ShoppingListReadOnlyError) {
		return fail(403, { message: err.message });
	}
	if (err instanceof ShoppingListNotFoundError) {
		return fail(404, { message: err.message });
	}
	throw err;
}

export const actions: Actions = {
	add: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		const parsed = parseAddShoppingListItem(
			Object.fromEntries(await event.request.formData())
		);
		if (!parsed.success) {
			return fail(400, { errors: parsed.errors });
		}

		try {
			await event.locals.shoppingListService.addItem(
				householdId,
				event.locals.householdRole!,
				parsed.data
			);
		} catch (err) {
			return handleServiceError(err);
		}

		return { success: true };
	},
	toggle: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));
		const id = (await event.request.formData()).get('id');
		if (!id || typeof id !== 'string')
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });

		try {
			await event.locals.shoppingListService.toggleChecked(
				householdId,
				event.locals.householdRole!,
				id
			);
		} catch (err) {
			return handleServiceError(err);
		}

		return { success: true };
	},
	remove: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));
		const id = (await event.request.formData()).get('id');
		if (!id || typeof id !== 'string')
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });

		try {
			await event.locals.shoppingListService.removeItem(
				householdId,
				event.locals.householdRole!,
				id
			);
		} catch (err) {
			return handleServiceError(err);
		}

		return { success: true };
	},
	clearChecked: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		try {
			await event.locals.shoppingListService.clearChecked(
				householdId,
				event.locals.householdRole!
			);
		} catch (err) {
			return handleServiceError(err);
		}

		return { success: true };
	},
	fillFromPantry: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		const locale = event.locals.locale;
		if (!householdId) error(400, translate(locale, 'errors.household.noHousehold'));

		const apiKey = getOpenAiApiKey();
		if (!apiKey) {
			return fail(503, {
				fillError: missingOpenAiKeyMessage('shopping suggestions')
			});
		}

		const formData = await event.request.formData();
		const preferencesRaw = formData.get('preferences');
		const householdSizeRaw = formData.get('householdSize');
		const preferences =
			typeof preferencesRaw === 'string' ? preferencesRaw.trim().slice(0, 300) : '';
		const householdSizeParsed = Number(householdSizeRaw);
		const householdSize =
			Number.isFinite(householdSizeParsed) &&
			householdSizeParsed >= 1 &&
			householdSizeParsed <= 8
				? Math.round(householdSizeParsed)
				: 2;

		const generated = await generateShoppingSuggestions(
			{
				apiKey,
				householdId,
				userId: event.locals.user!.id,
				inventoryService: event.locals.inventoryService,
				mealPlanService: event.locals.mealPlanService
			},
			{ preferences, householdSize }
		);

		if (!generated.ok) {
			const message =
				generated.message === 'parse_failed'
					? translate(locale, 'errors.api.suggestionsFailed')
					: generated.message;
			return fail(generated.status, { fillError: message });
		}

		try {
			const result = await event.locals.shoppingListService.addSuggestedItems(
				householdId,
				event.locals.householdRole!,
				generated.items.map(suggestionToListItem)
			);

			return {
				fillSuccess: {
					added: result.added,
					skipped: result.skipped,
					note: generated.note
				}
			};
		} catch (err) {
			return handleServiceError(err);
		}
	}
};

