import { isAdmin } from '$lib/server/auth';
import { getAllFeatureFlagSnapshot } from '$lib/server/feature-flags';
import { getLayoutClientFlagSnapshot } from '$lib/server/layout-client-flags';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	if (!locals.user || !isAdmin(locals.user)) {
		redirect(302, '/login');
	}

	return {
		user,
		serverFlags: getAllFeatureFlagSnapshot(),
		layoutFlags: getLayoutClientFlagSnapshot()
	};
};
