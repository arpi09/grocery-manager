import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { recordProductEvent } from '$lib/server/product-events';
import { parseAddShoppingListItem } from '$lib/validation/shopping-list.schemas';
import type { RequestHandler } from './$types';

const QUICK_ADD_SOURCES = ['quick_add_api', 'home_expiring_card'] as const;
type QuickAddSource = (typeof QUICK_ADD_SOURCES)[number];

function parseQuickAddBody(
	body: unknown
): { name: string; quantity?: string; unit?: string | null; source: QuickAddSource } | null {
	if (!body || typeof body !== 'object' || !('name' in body)) {
		return null;
	}
	const name = (body as { name: unknown }).name;
	if (typeof name !== 'string' || !name.trim()) {
		return null;
	}
	const quantityRaw = (body as { quantity?: unknown }).quantity;
	const unitRaw = (body as { unit?: unknown }).unit;
	const sourceRaw = (body as { source?: unknown }).source;
	return {
		name: name.trim(),
		quantity: typeof quantityRaw === 'string' && quantityRaw.trim() ? quantityRaw.trim() : undefined,
		unit: typeof unitRaw === 'string' ? unitRaw.trim() || null : undefined,
		source: QUICK_ADD_SOURCES.includes(sourceRaw as QuickAddSource)
			? (sourceRaw as QuickAddSource)
			: 'quick_add_api'
	};
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

	const parsedBody = parseQuickAddBody(await request.json().catch(() => null));
	if (!parsedBody) {
		return json({ error: 'Invalid item name' }, { status: 400 });
	}

	const parsed = parseAddShoppingListItem({
		name: parsedBody.name,
		quantity: parsedBody.quantity,
		unit: parsedBody.unit ?? undefined
	});
	if (!parsed.success) {
		return json({ error: 'Invalid item name' }, { status: 400 });
	}

	const item = await locals.shoppingListService.addItem(
		auth.householdId,
		locals.householdRole!,
		parsed.data,
		auth.user.id
	);

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		eventType: 'fill_suggestions_added',
		metadata: { name: item.name, source: parsedBody.source, count: 1 }
	});

	return json({ ok: true, item });
};
