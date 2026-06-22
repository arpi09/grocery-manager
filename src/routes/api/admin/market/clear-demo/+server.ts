import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/api-guards';
import { marketDemoService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const result = await marketDemoService.clear();
	return json({
		ok: true,
		deletedShares: result.deletedShares,
		deletedHouseholds: result.deletedHouseholds,
		deletedUsers: result.deletedUsers
	});
};
