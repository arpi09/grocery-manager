import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/api-guards';
import { marketListingService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const result = await marketListingService.runAutoListingRefreshBatch();
	return json({
		ok: true,
		...result
	});
};
