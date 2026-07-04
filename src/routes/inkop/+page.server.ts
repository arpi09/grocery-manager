import { canEditInventory } from '$lib/domain/household';
import { isShoppingListShareEnabled } from '$lib/server/shopping-list-share-flag';
import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import {
	normalizeShoppingToPantryMode,
	type ShoppingToPantryMode
} from '$lib/domain/shopping-to-pantry';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import {
	ShoppingListNotFoundError,
	ShoppingListReadOnlyError
} from '$lib/application/shopping-list.service';
import { ShoppingToPantryReadOnlyError } from '$lib/application/shopping-to-pantry.service';
import { parseAddShoppingListItem } from '$lib/validation/shopping-list.schemas';
import { translate } from '$lib/i18n/messages';
import { rankReplenishmentWithFeedback } from '$lib/server/replenishment-rank';
import { learningFeedbackRepository } from '$lib/server/di';
import { loadAutoFillPendingForInkop } from '$lib/server/auto-smart-fill';
import { takeAutoFillPending } from '$lib/server/auto-fill-pending';
import { getOpenAiApiKey } from '$lib/server/openai';
import { isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { suggestionToListItem } from '$lib/server/shopping-suggestions';
import { recordProductEvent } from '$lib/server/product-events';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { detectDedupeWarningsForKeys } from '$lib/domain/dedupe-autopilot';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isItemFinished } from '$lib/domain/inventory-item';
import { trackShoppingCheckoffToPantry } from '$lib/server/sync-analytics';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const householdId = locals.householdId;
	if (!householdId) {
		return {
			user,
			items: [],
			checkedCount: 0,
			canEdit: false,
			shareLinkEnabled: false,
			replenishmentSuggestions: [],
			shoppingToPantryMode: 'ask' as ShoppingToPantryMode,
			showMemoryExplorer: false
		};
	}

	const [items, checkedCount, shoppingToPantryMode] = await Promise.all([
		locals.shoppingListService.listUncheckedItems(householdId),
		locals.shoppingListService.countCheckedItems(householdId),
		user ? locals.shoppingToPantryService.getMode(user.id) : Promise.resolve('ask' as ShoppingToPantryMode)
	]);

	const e2eMockAi = isE2eMockAiEnabled();
	const intelligence = e2eMockAi
		? { replenishment: [], dedupeByKey: {} }
		: await locals.inventoryIntelligenceService.getHomeIntelligence(householdId);

	const replenishmentSuggestions = e2eMockAi
		? []
		: await rankReplenishmentWithFeedback(intelligence.replenishment, {
				householdId,
				locale: locals.locale,
				learningFeedbackRepository,
				apiKey: getOpenAiApiKey()
			});

	let autoFillPending: Awaited<ReturnType<typeof loadAutoFillPendingForInkop>> = null;
	if (!e2eMockAi && user && locals.householdRole) {
		try {
			autoFillPending = await loadAutoFillPendingForInkop({
				householdId,
				userId: user.id,
				role: locals.householdRole,
				locale: locals.locale === 'en' ? 'en' : 'sv',
				uncheckedCount: items.length,
				inventoryIntelligenceService: locals.inventoryIntelligenceService,
				inventoryService: locals.inventoryService,
				mealPlanService: locals.mealPlanService,
				shoppingListService: locals.shoppingListService,
				learningFeedbackRepository
			});
		} catch (loadError) {
			console.warn('[inkop] auto smart-fill degraded:', loadError);
		}
	}

	let storeDedupeByKey: ReturnType<typeof detectDedupeWarningsForKeys> = {};
	if (!e2eMockAi) {
		const [inventoryItems, dedupeContext] = await Promise.all([
			locals.inventoryService.listAll(householdId),
			locals.purchasePatternService.getDedupeContext(householdId)
		]);
		const activeItems = inventoryItems.filter((item) => !isItemFinished(item));
		const storeDedupeKeys = [
			...new Set(
				items
					.map((item) => normalizeReceiptProductName(item.name))
					.filter((key) => key.length > 0)
			)
		];
		storeDedupeByKey = detectDedupeWarningsForKeys(storeDedupeKeys, {
			activeItems,
			recentLines: dedupeContext.recentLines,
			listNormalizedNames: dedupeContext.listNormalizedNames
		});
	}

	return {
		user,
		items,
		checkedCount,
		canEdit: !!locals.householdRole && canEditInventory(locals.householdRole),
		shareLinkEnabled: isShoppingListShareEnabled(),
		replenishmentSuggestions,
		storeDedupeByKey,
		householdId,
		shoppingToPantryMode,
		showMemoryExplorer: isShelfLifeLearningEnabled(),
		autoFillPending
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
			const updated = await event.locals.shoppingListService.toggleChecked(
				householdId,
				event.locals.householdRole!,
				id
			);

			if (updated.checked) {
				const mode = await event.locals.shoppingToPantryService.getMode(event.locals.user!.id);
				const preview = await event.locals.shoppingToPantryService.previewAdd(householdId, updated);

				if (mode === 'always') {
					const result = await event.locals.shoppingToPantryService.addFromShopping(
						householdId,
						event.locals.user!.id,
						event.locals.householdRole!,
						updated,
						{
							location: preview.location,
							quantity: preview.quantity,
							unit: preview.unit,
							merge: Boolean(preview.mergeCandidate)
						}
					);
					trackShoppingCheckoffToPantry(event.locals.pmfService, {
						userId: event.locals.user!.id,
						householdId,
						added: true,
						action: result.action,
						mode: 'always'
					});
					return {
						success: true,
						pantryAdded: {
							message: translate(event.locals.locale, 'shopping.pantryBridge.addedToast', {
								name: updated.name
							}),
							auto: true,
							location: preview.location
						}
					};
				}

				if (mode === 'ask') {
					return {
						success: true,
						pantryBridge: {
							item: updated,
							preview,
							mode
						}
					};
				}
			}
		} catch (err) {
			if (err instanceof ShoppingToPantryReadOnlyError) {
				return fail(403, { message: err.message });
			}
			return handleServiceError(err);
		}

		return { success: true };
	},
	bulkToggleChecked: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		const formData = await event.request.formData();
		const ids = formData
			.getAll('ids')
			.filter((value): value is string => typeof value === 'string' && value.length > 0);
		if (ids.length === 0) {
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });
		}

		try {
			const updated = await event.locals.shoppingListService.toggleCheckedMany(
				householdId,
				event.locals.householdRole!,
				ids,
				true
			);
			return { success: true, checkedCount: updated.length };
		} catch (err) {
			return handleServiceError(err);
		}
	},
	addToPantry: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		const locale = event.locals.locale;
		if (!householdId) error(400, translate(locale, 'errors.household.noHousehold'));

		const formData = await event.request.formData();
		const shoppingItemId = formData.get('shoppingItemId');
		const locationRaw = formData.get('location');
		const quantityRaw = formData.get('quantity');
		const unitRaw = formData.get('unit');
		const mergeRaw = formData.get('merge');
		const modeRaw = formData.get('shoppingToPantryMode');

		if (typeof shoppingItemId !== 'string' || !shoppingItemId) {
			return fail(400, { message: translate(locale, 'errors.shopping.missingRowId') });
		}
		if (typeof locationRaw !== 'string' || !isStorageLocation(locationRaw)) {
			return fail(400, { message: translate(locale, 'errors.api.invalidLocation') });
		}

		const mode = normalizeShoppingToPantryMode(modeRaw);
		await event.locals.profileService.setShoppingToPantryMode(event.locals.user!.id, mode);

		const checkedItems = await event.locals.shoppingListService.listCheckedItems(householdId);
		const shoppingItem = checkedItems.find((item) => item.id === shoppingItemId);
		if (!shoppingItem) {
			return fail(404, { message: translate(locale, 'errors.shopping.missingRowId') });
		}

		try {
			const result = await event.locals.shoppingToPantryService.addFromShopping(
				householdId,
				event.locals.user!.id,
				event.locals.householdRole!,
				shoppingItem,
				{
					location: locationRaw as StorageLocation,
					quantity: typeof quantityRaw === 'string' ? quantityRaw : undefined,
					unit: typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw : null,
					merge: mergeRaw === '1'
				}
			);

			trackShoppingCheckoffToPantry(event.locals.pmfService, {
				userId: event.locals.user!.id,
				householdId,
				added: true,
				action: result.action,
				mode
			});

			return {
				pantryAdded: {
					message: translate(locale, 'shopping.pantryBridge.addedToast', { name: shoppingItem.name }),
					location: locationRaw as StorageLocation
				}
			};
		} catch (err) {
			if (err instanceof ShoppingToPantryReadOnlyError) {
				return fail(403, { message: err.message });
			}
			throw err;
		}
	},
	savePantryMode: async (event) => {
		const user = event.locals.user;
		if (!user) {
			error(401, translate(event.locals.locale, 'errors.api.unauthorized'));
		}

		const formData = await event.request.formData();
		const mode = normalizeShoppingToPantryMode(formData.get('shoppingToPantryMode'));
		await event.locals.profileService.setShoppingToPantryMode(user.id, mode);

		return { success: true, shoppingToPantryMode: mode };
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
	acceptAutoFill: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		const locale = event.locals.locale;
		if (!householdId) error(400, translate(locale, 'errors.household.noHousehold'));

		const pending = takeAutoFillPending(householdId, event.locals.user!.id);
		if (!pending || pending.items.length === 0) {
			return fail(404, { message: translate(locale, 'shopping.autoFillExpired') });
		}

		try {
			const result = await event.locals.shoppingListService.addSuggestedItems(
				householdId,
				event.locals.householdRole!,
				pending.items.map(suggestionToListItem)
			);

			recordProductEvent(event.locals.pmfService, {
				userId: event.locals.user!.id,
				householdId,
				eventType: 'fill_suggestions_added',
				metadata: {
					added: result.added,
					skipped: result.skipped,
					source: 'auto_fill_pending'
				}
			});

			return {
				fillSuccess: {
					added: result.added,
					skipped: result.skipped,
					note: pending.note,
					suggestions: pending.items.slice(0, 8).map((item) => ({
						name: item.name,
						relatedMealDate: item.relatedMealDate ?? null,
						relatedRecipeTitle: item.relatedRecipeTitle ?? null
					}))
				}
			};
		} catch (err) {
			return handleServiceError(err);
		}
	}
};

