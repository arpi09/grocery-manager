import { json } from '@sveltejs/kit';
import { requireUser } from '$lib/server/api-guards';
import { buildInventoryInsights } from '$lib/server/inventory-insights';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}
	if (!locals.householdId) {
		return json({ insights: buildInventoryInsights([]) });
	}

	const items = await locals.inventoryService.listAll(locals.householdId);
	return json({ insights: buildInventoryInsights(items) });
};
