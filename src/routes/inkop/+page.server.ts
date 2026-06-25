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
import { translate, type MessageKey } from '$lib/i18n/messages';
import { rankReplenishmentWithFeedback } from '$lib/server/replenishment-rank';
import { learningFeedbackRepository } from '$lib/server/di';
import { loadAutoFillPendingForInkop } from '$lib/server/auto-smart-fill';
import { takeAutoFillPending } from '$lib/server/auto-fill-pending';
import { getOpenAiApiKey, OPENAI_NOT_CONFIGURED_KEY } from '$lib/server/openai';
import { checkAiQuotaForAction } from '$lib/server/ai-rate-limit';
import { e2eMockShoppingSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import {
	generateShoppingSuggestions,
	suggestionToListItem,
	type ShoppingSuggestion
} from '$lib/server/shopping-suggestions';
import { recordProductEvent } from '$lib/server/product-events';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { isShoppingUxV2Enabled } from '$lib/server/shopping-ux-v2-flag';
import { detectDedupeWarningsForKeys } from '$lib/domain/dedupe-autopilot';
import { buildListIntelligenceHints } from '$lib/domain/brain/list-intelligence';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isItemFinished } from '$lib/domain/inventory-item';
import { trackShoppingCheckoffToPantry } from '$lib/server/sync-analytics';
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
		return {
			user,
			items: [],
			checkedCount: 0,
			canEdit: false,
			shareLinkEnabled: false,
			replenishmentSuggestions: [],
			dedupeByKey: {},
			shoppingToPantryMode: 'ask' as ShoppingToPantryMode,
			showMemoryExplorer: false,
			shoppingUxV2Enabled: isShoppingUxV2Enabled()
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

	const listHints = buildListIntelligenceHints({
		replenishment: replenishmentSuggestions,
		maxHints: 2
	});

	return {
		user,
		items,
		checkedCount,
		canEdit: !!locals.householdRole && canEditInventory(locals.householdRole),
		shareLinkEnabled: isShoppingListShareEnabled(),
		replenishmentSuggestions,
		dedupeByKey: intelligence.dedupeByKey,
		storeDedupeByKey,
		householdId,
		shoppingToPantryMode,
		showMemoryExplorer: isShelfLifeLearningEnabled(),
		shoppingUxV2Enabled: isShoppingUxV2Enabled(),
		autoFillPending,
		listHints
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
							mealPlanService: event.locals.mealPlanService,
							shoppingListService: event.locals.shoppingListService,
							learningFeedbackRepository
						},
						{ preferences, householdSize, locale: event.locals.locale === 'en' ? 'en' : 'sv' }
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
					note: generated.note,
					suggestions: generated.items.slice(0, 8).map((item) => ({
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

