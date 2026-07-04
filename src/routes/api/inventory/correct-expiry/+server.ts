import { json } from '@sveltejs/kit';
import { InventoryNotFoundError } from '$lib/application/inventory.service';
import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import type { RequestHandler } from './$types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseBody(body: unknown): { itemId: string; expiresOn: string } | null {
	if (!body || typeof body !== 'object') return null;
	const itemIdRaw = (body as { itemId?: unknown }).itemId;
	const expiresOnRaw = (body as { expiresOn?: unknown }).expiresOn;
	if (typeof itemIdRaw !== 'string' || !itemIdRaw.trim()) return null;
	if (typeof expiresOnRaw !== 'string' || !ISO_DATE.test(expiresOnRaw)) return null;
	if (Number.isNaN(Date.parse(expiresOnRaw))) return null;
	return { itemId: itemIdRaw.trim(), expiresOn: expiresOnRaw };
}

/**
 * One-tap expiry correction from the "why" sheet. Mirrors the learning side effects
 * of the item edit form (item/[id]/edit) so a correction here reaches the same
 * learning-feedback repository — the explicit action the sheet promises the user.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const parsed = parseBody(await request.json().catch(() => null));
	if (!parsed) {
		return json({ error: translate(locals.locale, 'errors.api.invalidInput') }, { status: 400 });
	}

	let existing;
	try {
		existing = await locals.inventoryService.getItem(auth.householdId, parsed.itemId);
	} catch (error) {
		if (error instanceof InventoryNotFoundError) {
			return json({ error: translate(locals.locale, 'errors.api.notFound') }, { status: 404 });
		}
		throw error;
	}

	const expiryCorrected =
		isShelfLifeLearningEnabled() &&
		isEstimatedExpirySource(existing.expiresOnSource) &&
		parsed.expiresOn !== existing.expiresOn;

	try {
		await locals.inventoryService.updateItem(
			auth.householdId,
			parsed.itemId,
			{ expiresOn: parsed.expiresOn, expiresOnSource: 'user_set' },
			locals.householdRole!
		);
	} catch (error) {
		if (error instanceof InventoryNotFoundError) {
			return json({ error: translate(locals.locale, 'errors.api.notFound') }, { status: 404 });
		}
		throw error;
	}

	if (expiryCorrected) {
		const normalizedKey = normalizeReceiptProductName(existing.name);
		if (normalizedKey) {
			await locals.learningEngineService.recordFeedback({
				householdId: auth.householdId,
				userId: auth.user.id,
				normalizedKey,
				context: {
					location: existing.location,
					productName: existing.name,
					source: 'inventory_edit'
				},
				predictedExpiresOn: existing.expiresOn,
				predictedTypicalDays: null,
				actualExpiresOn: parsed.expiresOn,
				feedbackType: 'corrected',
				modelVersion: 'explain-sheet'
			});
		}
	}

	return json({ ok: true, expiresOn: parsed.expiresOn, name: existing.name, corrected: expiryCorrected });
};
