import { error } from '@sveltejs/kit';
import { getStoreGuide } from '$lib/marketing/store-guides';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const storeGuide = getStoreGuide(params.store);
	if (!storeGuide) {
		error(404, 'Not found');
	}
	return { storeGuide };
};
