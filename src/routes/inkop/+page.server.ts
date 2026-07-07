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
import { parseUnpackRows } from '$lib/domain/shopping-unpack';
import { translate } from '$lib/i18n/messages';
import { rankReplenishmentWithFeedback } from '$lib/server/replenishment-rank';
import { learningFeedbackRepository } from '$lib/server/di';
import { loadSundayAiSuggestions } from '$lib/server/auto-smart-fill';
import { getOpenAiApiKey } from '$lib/server/openai';
import { isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { parseSuggestionQuantity } from '$lib/server/shopping-suggestions';
import { buildSundayProposal } from '$lib/domain/sunday-suggestion';
import { parseSundayAddRows } from '$lib/domain/sunday-add';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import {
	PurchasePatternNotFoundError,
	PurchasePatternReadOnlyError
} from '$lib/application/purchase-pattern.service';
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
			sundayProposal: [],
			sundayNote: null,
			shoppingToPantryMode: 'ask' as ShoppingToPantryMode,
			showMemoryExplorer: false
		};
	}

	/* Replenishment leads the Söndagsförslag, so rank a few more than the home rail's 3
	 * before the fusion caps the whole proposal at SUNDAY_SUGGESTION_MAX. */
	const INKOP_REPLENISHMENT_MAX = 6;

	const [items, checkedCount, shoppingToPantryMode, members] = await Promise.all([
		locals.shoppingListService.listUncheckedItems(householdId),
		locals.shoppingListService.countCheckedItems(householdId),
		user ? locals.shoppingToPantryService.getMode(user.id) : Promise.resolve('ask' as ShoppingToPantryMode),
		locals.householdService.getHouseholdMembers(householdId)
	]);

	// Member provenance ("Tillagd av X") — only meaningful in a shared household,
	// so skip solo households. Own rows read "Tillagd av dig".
	const memberNameById = new Map((members ?? []).map((m) => [m.userId, m.displayName]));
	const showProvenance = (members?.length ?? 0) >= 2;
	const selfLabel = translate(locals.locale, 'shopping.v2.summary.you');
	const itemsWithProvenance = items.map((item) => ({
		...item,
		addedByName:
			showProvenance && item.addedByUserId
				? item.addedByUserId === user?.id
					? selfLabel
					: (memberNameById.get(item.addedByUserId) ?? null)
				: null
	}));

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
				apiKey: getOpenAiApiKey(),
				maxItems: INKOP_REPLENISHMENT_MAX
			});

	let sundayAi: Awaited<ReturnType<typeof loadSundayAiSuggestions>> = null;
	if (!e2eMockAi && user && locals.householdRole) {
		try {
			sundayAi = await loadSundayAiSuggestions({
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
			console.warn('[inkop] söndagsförslag AI degraded:', loadError);
		}
	}

	/* Fuse the deterministic replenishment cadence with the AI stream (expiring restocks +
	 * planned meals + staples). Everything stays a proposal until the user taps a row in. */
	const sundayProposal = buildSundayProposal({
		replenishment: replenishmentSuggestions,
		aiSuggestions: sundayAi?.items ?? [],
		listItems: items
	});

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
		items: itemsWithProvenance,
		checkedCount,
		canEdit: !!locals.householdRole && canEditInventory(locals.householdRole),
		shareLinkEnabled: isShoppingListShareEnabled(),
		sundayProposal,
		sundayNote: sundayAi?.note ?? null,
		storeDedupeByKey,
		householdId,
		shoppingToPantryMode,
		showMemoryExplorer: isShelfLifeLearningEnabled()
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
			/* Loop-funnel telemetry: the household's very first list row is the activation moment. */
			const existing = await event.locals.shoppingListService.listItems(householdId);
			await event.locals.shoppingListService.addItem(
				householdId,
				event.locals.householdRole!,
				parsed.data,
				event.locals.user?.id ?? null
			);
			if (existing.length === 0) {
				recordProductEvent(event.locals.pmfService, {
					userId: event.locals.user?.id ?? null,
					householdId,
					eventType: 'shopping_first_item_added',
					metadata: { surface: 'inkop_add' }
				});
			}
		} catch (err) {
			return handleServiceError(err);
		}

		return { success: true };
	},
	toggle: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));
		const formData = await event.request.formData();
		const id = formData.get('id');
		/* Shop mode defers the pantry bridge to the trip-complete "Packa upp" moment. */
		const deferBridge = formData.get('bridge') === 'defer';
		if (!id || typeof id !== 'string')
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });

		try {
			const updated = await event.locals.shoppingListService.toggleChecked(
				householdId,
				event.locals.householdRole!,
				id
			);

			if (updated.checked && !deferBridge) {
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
	toggleUnavailable: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));
		const id = (await event.request.formData()).get('id');
		if (!id || typeof id !== 'string')
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });

		try {
			const updated = await event.locals.shoppingListService.toggleUnavailable(
				householdId,
				event.locals.householdRole!,
				id
			);
			return { success: true, unavailable: updated.unavailableAt !== null };
		} catch (err) {
			return handleServiceError(err);
		}
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
	unpackPreview: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		const formData = await event.request.formData();
		const sinceRaw = formData.get('since');
		const since = typeof sinceRaw === 'string' ? Number(sinceRaw) : NaN;
		if (!Number.isFinite(since)) {
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.unpackFailed') });
		}

		const checkedItems = await event.locals.shoppingListService.listCheckedItems(householdId);
		const tripItems = checkedItems.filter((item) => item.updatedAt.getTime() >= since);

		const rows = [];
		for (const item of tripItems) {
			rows.push({
				item,
				preview: await event.locals.shoppingToPantryService.previewAdd(householdId, item)
			});
		}

		return { unpack: { rows } };
	},
	unpackAll: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		const locale = event.locals.locale;
		if (!householdId) error(400, translate(locale, 'errors.household.noHousehold'));

		const formData = await event.request.formData();
		const rows = parseUnpackRows(formData.get('rows'));
		if (!rows) {
			return fail(400, { message: translate(locale, 'errors.shopping.unpackFailed') });
		}

		const checkedItems = await event.locals.shoppingListService.listCheckedItems(householdId);
		const byId = new Map(checkedItems.map((item) => [item.id, item]));

		let added = 0;
		let merged = 0;
		try {
			for (const row of rows) {
				const listItem = row.shoppingItemId ? byId.get(row.shoppingItemId) : undefined;
				const now = new Date();
				const item = listItem ?? {
					id: `unpack-extra-${added + merged}`,
					householdId,
					name: row.name,
					quantity: row.quantity,
					unit: row.unit,
					checked: true,
					unavailableAt: null,
					addedByUserId: null,
					sortOrder: 0,
					createdAt: now,
					updatedAt: now
				};

				const result = await event.locals.shoppingToPantryService.addFromShopping(
					householdId,
					event.locals.user!.id,
					event.locals.householdRole!,
					item,
					{ location: row.location, quantity: row.quantity, unit: row.unit }
				);
				if (result.action === 'merged') {
					merged += 1;
				} else {
					added += 1;
				}

				trackShoppingCheckoffToPantry(event.locals.pmfService, {
					userId: event.locals.user!.id,
					householdId,
					added: true,
					action: result.action,
					mode: 'unpack_batch'
				});
			}
		} catch (err) {
			if (err instanceof ShoppingToPantryReadOnlyError) {
				return fail(403, { message: err.message });
			}
			throw err;
		}

		/* Loop-funnel telemetry: ONE event per closed loop (gesture), not per item. */
		if (added + merged > 0) {
			recordProductEvent(event.locals.pmfService, {
				userId: event.locals.user!.id,
				householdId,
				eventType: 'shopping_loop_closed',
				metadata: { count: added + merged, added, merged }
			});
		}

		return {
			unpacked: {
				count: added + merged,
				added,
				merged,
				message: translate(locale, 'shopping.v2.unpack.doneToast', { count: added + merged })
			}
		};
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
	clearList: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		try {
			const removed = await event.locals.shoppingListService.clearUnchecked(
				householdId,
				event.locals.householdRole!
			);
			return { success: true, cleared: removed };
		} catch (err) {
			return handleServiceError(err);
		}
	},
	restoreList: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		if (!householdId) error(400, translate(event.locals.locale, 'errors.household.noHousehold'));

		const raw = (await event.request.formData()).get('items');
		if (typeof raw !== 'string' || !raw) {
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });
		}
		if (!Array.isArray(parsed)) {
			return fail(400, { message: translate(event.locals.locale, 'errors.shopping.missingRowId') });
		}

		const inputs = parsed
			.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
			.map((entry) => ({
				name: typeof entry.name === 'string' ? entry.name.trim().slice(0, 120) : '',
				quantity: typeof entry.quantity === 'string' ? entry.quantity : null,
				unit: typeof entry.unit === 'string' ? entry.unit : null
			}))
			.filter((input) => input.name.length > 0)
			.slice(0, 200);

		if (inputs.length === 0) {
			return { success: true, restored: 0 };
		}

		try {
			const result = await event.locals.shoppingListService.addSuggestedItems(
				householdId,
				event.locals.householdRole!,
				inputs,
				event.locals.user?.id ?? null
			);
			return { success: true, restored: result.added };
		} catch (err) {
			return handleServiceError(err);
		}
	},
	/**
	 * Söndagsförslaget accept — takes the exact rows the user saw (one row for a per-row tap,
	 * all rows for "Lägg till alla") and adds them to the shared list. Replenishment rows go
	 * through the learning-backed accept; AI rows are deduped-added. Nothing else is touched.
	 */
	sundayAdd: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);
		const householdId = event.locals.householdId;
		const locale = event.locals.locale;
		if (!householdId) error(400, translate(locale, 'errors.household.noHousehold'));

		const formData = await event.request.formData();
		const rows = parseSundayAddRows(formData.get('rows'));
		if (!rows) {
			return fail(400, { message: translate(locale, 'shopping.sunday.addFailed') });
		}

		const userId = event.locals.user!.id;
		const role = event.locals.householdRole!;

		let added = 0;
		let skipped = 0;
		const aiInputs: CreateShoppingListItemInput[] = [];

		try {
			for (const row of rows) {
				if (row.source === 'replenishment' && row.normalizedKey) {
					try {
						const result = await event.locals.purchasePatternService.acceptReplenishmentToList(
							householdId,
							role,
							row.normalizedKey
						);
						added += 1;

						await event.locals.learningEngineService.recordPredictorFeedback({
							householdId,
							userId,
							predictorId: 'replenishment',
							normalizedKey: row.normalizedKey,
							feedbackType: 'accepted',
							predictedValue: row.normalizedKey,
							actualValue: result.name,
							contextJson: { displayName: result.name, surface: 'inkop_sunday' }
						});

						for (const eventType of [
							'replenishment_suggestion_added',
							'replenishment_suggestion_accepted',
							'replenishment_actioned'
						] as const) {
							recordProductEvent(event.locals.pmfService, {
								userId,
								householdId,
								eventType,
								metadata: { normalizedKey: row.normalizedKey, name: result.name, surface: 'inkop_sunday' }
							});
						}
					} catch (err) {
						/* Stale key (partner already handled it) — skip this row, keep the rest. */
						if (err instanceof PurchasePatternNotFoundError) {
							skipped += 1;
							continue;
						}
						throw err;
					}
				} else {
					const { quantity, unit } = parseSuggestionQuantity(row.quantity);
					aiInputs.push({ name: row.name, quantity, unit });
				}
			}

			if (aiInputs.length > 0) {
				const result = await event.locals.shoppingListService.addSuggestedItems(
					householdId,
					role,
					aiInputs,
					event.locals.user?.id ?? null
				);
				added += result.added;
				skipped += result.skipped;

				recordProductEvent(event.locals.pmfService, {
					userId,
					householdId,
					eventType: 'fill_suggestions_added',
					metadata: { added: result.added, skipped: result.skipped, source: 'inkop_sunday' }
				});
			}
		} catch (err) {
			if (err instanceof PurchasePatternReadOnlyError) {
				return fail(403, { message: err.message });
			}
			return handleServiceError(err);
		}

		return { sundayAdded: { added, skipped } };
	}
};

