import { json } from '@sveltejs/kit';
import {
	PurchasePatternNotFoundError,
	PurchasePatternReadOnlyError
} from '$lib/application/purchase-pattern.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import type { RequestHandler } from './$types';

function parseInventoryItemId(body: unknown): string | null {
	if (!body || typeof body !== 'object' || !('inventoryItemId' in body)) {
		return null;
	}
	const id = (body as { inventoryItemId: unknown }).inventoryItemId;
	return typeof id === 'string' && id.trim() ? id.trim() : null;
}

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

	const inventoryItemId = parseInventoryItemId(await request.json().catch(() => null));
	if (!inventoryItemId) {
		return json({ error: translate(locals.locale, 'receiptAutopilot.invalidKey') }, { status: 400 });
	}

	try {
		await locals.purchasePatternService.dismissFinishSuggestion(
			auth.householdId,
			locals.householdRole!,
			inventoryItemId
		);
		return json({ ok: true });
	} catch (error) {
		if (error instanceof PurchasePatternReadOnlyError) {
			return json({ error: error.message }, { status: 403 });
		}
		if (error instanceof PurchasePatternNotFoundError) {
			return json(
				{ error: translate(locals.locale, 'receiptAutopilot.notFound') },
				{ status: 404 }
			);
		}
		throw error;
	}
};
