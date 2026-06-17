import { error, redirect } from '@sveltejs/kit';
import { isPriceMemoryV1Enabled } from '$lib/server/price-memory-flag';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const householdId = locals.householdId;

	if (!user || !householdId) {
		throw error(403, 'Forbidden');
	}

	if (!isPriceMemoryV1Enabled()) {
		throw redirect(302, '/settings');
	}

	return { user };
};
