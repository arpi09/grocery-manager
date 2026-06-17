import { json } from '@sveltejs/kit';
import { requireHousehold } from '$lib/server/api-guards';
import { emitPriceMemorySummaryViewed } from '$lib/server/price-memory-telemetry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const inventoryItemId = url.searchParams.get('inventoryItemId')?.trim() ?? '';
	const key = url.searchParams.get('key')?.trim() ?? '';
	const conceptKey = url.searchParams.get('conceptKey')?.trim() ?? '';
	const entryPoint = url.searchParams.get('entryPoint');

	let summary = null;
	if (inventoryItemId) {
		summary = await locals.priceMemoryService.getSummaryByInventoryItemId(
			auth.householdId,
			inventoryItemId
		);
	} else if (conceptKey) {
		summary = await locals.priceMemoryService.getSummaryByConceptKey(auth.householdId, conceptKey);
	} else if (key) {
		summary = await locals.priceMemoryService.getSummaryByKey(auth.householdId, key);
	} else {
		return json({ ok: false, error: 'Missing lookup parameter' }, { status: 400 });
	}

	emitPriceMemorySummaryViewed(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		summary,
		entryPoint
	});

	return json({ ok: true, summary });
};
