import { json } from '@sveltejs/kit';
import {
	PurchasePatternNotFoundError,
	PurchasePatternReadOnlyError
} from '$lib/application/purchase-pattern.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import type { RequestHandler } from './$types';

function parseNormalizedKey(body: unknown): string | null {
	if (!body || typeof body !== 'object' || !('normalizedKey' in body)) {
		return null;
	}
	const key = (body as { normalizedKey: unknown }).normalizedKey;
	return typeof key === 'string' && key.trim() ? key.trim() : null;
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

	const normalizedKey = parseNormalizedKey(await request.json().catch(() => null));
	if (!normalizedKey) {
		return json({ error: translate(locals.locale, 'receiptAutopilot.invalidKey') }, { status: 400 });
	}

	try {
		await locals.purchasePatternService.dismissSuggestion(
			auth.householdId,
			locals.householdRole!,
			normalizedKey
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
