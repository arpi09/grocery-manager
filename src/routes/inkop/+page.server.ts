import { canEditInventory } from '$lib/domain/household';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import {
	ShoppingListNotFoundError,
	ShoppingListReadOnlyError
} from '$lib/application/shopping-list.service';
import { parseAddShoppingListItem } from '$lib/validation/shopping-list.schemas';
import { translate, type MessageKey } from '$lib/i18n/messages';
import { getOpenAiApiKey, OPENAI_NOT_CONFIGURED_KEY } from '$lib/server/openai';
import { checkAiQuotaForAction } from '$lib/server/ai-rate-limit';
import { e2eMockShoppingSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import {
	generateShoppingSuggestions,
	suggestionToListItem,
	type ShoppingSuggestion
} from '$lib/server/shopping-suggestions';
import { recordProductEvent } from '$lib/server/product-events';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type SmartFillResult =
	| { ok: true; items: ShoppingSuggestion[]; note: string | null }
	| { ok: false; status: number; message: string }
	| { ok: false; status: number; messageKey: MessageKey };

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

		const formData = await event.request.formData();

		const generated: SmartFillResult = isE2eMockAiEnabled()
			? e2eMockShoppingSuggestions()
			: await (async () => {
					const apiKey = getOpenAiApiKey();
					if (!apiKey) {
						return {
							ok: false as const,
							status: 503,
							messageKey: OPENAI_NOT_CONFIGURED_KEY
						};
					}

					const quota = await checkAiQuotaForAction(
						event.locals,
						'smart_fill',
						event.locals.user!.id
					);
					if (quota.denied) {
						return { ok: false as const, status: 429, message: quota.message };
					}

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

					return generateShoppingSuggestions(
						{
							apiKey,
							householdId,
							userId: event.locals.user!.id,
							inventoryService: event.locals.inventoryService,
							mealPlanService: event.locals.mealPlanService
						},
						{ preferences, householdSize }
					);
				})();

		if (!generated.ok) {
			const fillError =
				'message' in generated
					? generated.message
					: translate(locale, generated.messageKey);
			return fail(generated.status, { fillError });
		}

		try {
			const result = await event.locals.shoppingListService.addSuggestedItems(
				householdId,
				event.locals.householdRole!,
				generated.items.map(suggestionToListItem)
			);

			recordProductEvent(event.locals.pmfService, {
				userId: event.locals.user!.id,
				householdId,
				eventType: 'fill_suggestions_added',
				metadata: {
					added: result.added,
					skipped: result.skipped
				}
			});

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

