import { json } from '@sveltejs/kit';
import { requireHousehold } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const key = url.searchParams.get('key')?.trim() ?? '';
	if (!key) {
		return json({ ok: false, error: 'Missing key' }, { status: 400 });
	}

	const lastPaidPrice = await locals.priceMemoryService.getLastPaidPrice(auth.householdId, key);
	return json({ ok: true, lastPaidPrice });
};
