import { json } from '@sveltejs/kit';
import { requireHousehold } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const analytics = await locals.inventoryService.getAnalytics(auth.householdId);
	return json(analytics);
};
