import {
	InvalidConsumptionAmountError,
	InventoryNotFoundError
} from '$lib/application/inventory.service';
import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { consumeItemSchema } from '$lib/validation/consumption.schemas';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { recordInventoryEditLocationFeedback } from '$lib/server/location-feedback-recording';
import { isLocationLearningEnabled } from '$lib/server/feature-flags';
import { recordConsumptionShelfLifeFeedback } from '$lib/server/shelf-life-consumption-feedback';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { isPriceMemoryV1Enabled } from '$lib/server/price-memory-flag';
import { emitPriceMemorySummaryViewed } from '$lib/server/price-memory-telemetry';
import { itemSchema } from '$lib/validation/inventory.schemas';
import { formatNumericQuantity, parseNumericQuantity } from '$lib/domain/consumption-quantity';
import { trackInventoryWrite } from '$lib/server/sync-analytics';
import { appendActionToast } from '$lib/utils/action-toast';
import { appendCelebration } from '$lib/utils/gamification-celebrate';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	requireInventoryWriteAccess(locals.householdRole);

	try {
		const item = await locals.inventoryService.getItem(locals.householdId!, params.id);
		const purchaseMemorySummary =
			isPriceMemoryV1Enabled() && locals.householdId
				? await locals.priceMemoryService.getSummaryByInventoryItemId(
						locals.householdId,
						params.id
					)
				: null;
		if (locals.user && locals.householdId) {
			emitPriceMemorySummaryViewed(locals.pmfService, {
				userId: locals.user.id,
				householdId: locals.householdId,
				summary: purchaseMemorySummary,
				entryPoint: 'product_detail'
			});
		}
		return {
			item,
			purchaseMemorySummary:
				purchaseMemorySummary && purchaseMemorySummary.purchaseCount > 0
					? purchaseMemorySummary
					: null
		};
	} catch (e) {
		if (e instanceof InventoryNotFoundError) {
			error(404, 'Item not found');
		}
		throw e;
	}
};

function parseItemForm(formData: FormData) {
	const raw = Object.fromEntries(formData);
	return itemSchema.safeParse({
		...raw,
		unit: raw.unit || undefined,
		expiresOn: raw.expiresOn || undefined,
		notes: raw.notes || undefined
	});
}

export const actions: Actions = {
	save: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const parsed = parseItemForm(await event.request.formData());

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		let existing;
		try {
			existing = await event.locals.inventoryService.getItem(
				event.locals.householdId!,
				event.params.id
			);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		const newExpiresOn = parsed.data.expiresOn || null;
		const locationChanged =
			isLocationLearningEnabled() && parsed.data.location !== existing.location;
		const expiryCorrected =
			isShelfLifeLearningEnabled() &&
			isEstimatedExpirySource(existing.expiresOnSource) &&
			newExpiresOn !== existing.expiresOn;

		try {
			await event.locals.inventoryService.updateItem(
				event.locals.householdId!,
				event.params.id,
				{
					name: parsed.data.name,
					location: parsed.data.location,
					quantity: parsed.data.quantity,
					unit: parsed.data.unit || null,
					expiresOn: newExpiresOn,
					expiresOnSource: newExpiresOn ? 'user_set' : null,
					notes: parsed.data.notes || null
				},
				event.locals.householdRole!
			);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		if (expiryCorrected && newExpiresOn) {
			const normalizedKey = normalizeReceiptProductName(parsed.data.name);
			if (normalizedKey) {
				await event.locals.learningEngineService.recordFeedback({
					householdId: event.locals.householdId!,
					userId: event.locals.user!.id,
					normalizedKey,
					context: {
						location: parsed.data.location,
						productName: parsed.data.name,
						source: 'inventory_edit'
					},
					predictedExpiresOn: existing.expiresOn,
					predictedTypicalDays: null,
					actualExpiresOn: newExpiresOn,
					feedbackType: 'corrected',
					modelVersion: 'inventory-edit'
				});
			}
		}

		if (locationChanged) {
			await recordInventoryEditLocationFeedback({
				learningEngine: event.locals.learningEngineService,
				householdId: event.locals.householdId!,
				userId: event.locals.user!.id,
				productName: parsed.data.name,
				previousLocation: existing.location,
				newLocation: parsed.data.location
			});
		}

		const toastKind = expiryCorrected ? 'learningCorrected' : 'itemUpdated';
		redirect(
			302,
			appendActionToast(`/inventory/${parsed.data.location}`, toastKind, parsed.data.name)
		);
	},
	delete: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		let location = 'fridge';
		let itemName = '';
		try {
			const item = await event.locals.inventoryService.getItem(
				event.locals.householdId!,
				event.params.id
			);
			location = item.location;
			itemName = item.name;
			await event.locals.inventoryService.deleteItem(
				event.locals.householdId!,
				event.params.id,
				event.locals.user!.id,
				event.locals.householdRole!
			);
		} catch (e) {
			if (e instanceof InventoryNotFoundError) {
				error(404, 'Item not found');
			}
			throw e;
		}

		redirect(302, appendActionToast(`/inventory/${location}`, 'itemDeleted', itemName));
	},
	markAsFinished: async (event) => {
		requireInventoryWriteAccess(event.locals.householdRole);

		const formData = await event.request.formData();
		const parsed = consumeItemSchema.safeParse({
			consumptionPreset: formData.get('consumptionPreset') || undefined,
			consumptionAmount: formData.get('consumptionAmount') || undefined
		});
		if (!parsed.success) {
			return fail(400, { consumeErrors: parsed.error.flatten().fieldErrors });
		}

		let itemName = '';
		let toastKind: 'itemFinished' | 'itemPartiallyConsumed' = 'itemFinished';
		let remainingLabel: string | undefined;
		let consumeFinished = false;
		try {
			const existing = await event.locals.inventoryService.getItem(
				event.locals.householdId!,
				event.params.id
			);
			const result = await event.locals.inventoryService.consumeItem(
				event.locals.householdId!,
				event.params.id,
				event.locals.user!.id,
				event.locals.householdRole!,
				{ preset: parsed.data.preset, customAmount: parsed.data.customAmount }
			);
			itemName = result.item.name;
			consumeFinished = result.finished;
			if (!result.finished) {
				toastKind = 'itemPartiallyConsumed';
				const unitSuffix = result.item.unit ? ` ${result.item.unit}` : '';
				const remainingQty = parseNumericQuantity(result.item.quantity);
				if (remainingQty !== null) {
					remainingLabel = `${formatNumericQuantity(remainingQty)}${unitSuffix}`.trim();
				}
			}

			trackInventoryWrite(event.locals.pmfService, {
				userId: event.locals.user!.id,
				householdId: event.locals.householdId,
				action: 'consume',
				itemId: event.params.id
			});

			if (isShelfLifeLearningEnabled() && existing) {
				await recordConsumptionShelfLifeFeedback({
					learningEngine: event.locals.learningEngineService,
					householdId: event.locals.householdId!,
					userId: event.locals.user!.id,
					item: existing,
					finished: consumeFinished
				});
			}
		} catch (e) {
			if (e instanceof InventoryNotFoundError) error(404, 'Item not found');
			if (e instanceof InvalidConsumptionAmountError) {
				return fail(400, { consumeErrors: { consumptionAmount: ['invalid'] } });
			}
			throw e;
		}

		const celebration =
			toastKind === 'itemFinished'
				? await event.locals.gamificationService.detectMarkFinishedCelebration(
						event.locals.householdId!
					)
				: null;
		let redirectPath = appendActionToast(
			`/item/${event.params.id}/edit`,
			toastKind,
			itemName,
			remainingLabel
		);
		if (celebration) redirectPath = appendCelebration(redirectPath, celebration);
		redirect(302, redirectPath);
	}
};
