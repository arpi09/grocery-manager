import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/api-guards';
import { marketDemoService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const result = await marketDemoService.seedForAdmin(auth.user.id);
	if (!result.ok) {
		return json({ ok: false, error: result.error }, { status: 403 });
	}

	return json({
		ok: true,
		listingCount: result.listingCount,
		center: result.center,
		enabledNearbyForAdmin: result.enabledNearbyForAdmin
	});
};
