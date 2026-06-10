import { error, redirect } from '@sveltejs/kit';
import { expiringShareService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params, locals, url }) => {
	const { user } = await parent();
	if (!user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	if (!locals.householdId) {
		error(400, 'Household required');
	}

	const preview = await expiringShareService.getNearbySharePreviewForViewer(
		user.id,
		locals.householdId,
		params.id
	);

	if (!preview) {
		error(404, 'Not found');
	}

	return { preview, shareId: params.id, user };
};
