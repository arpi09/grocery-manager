import { error } from '@sveltejs/kit';
import { shoppingListShareService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const preview = await shoppingListShareService.getSharePreview(params.token);
	if (!preview) {
		error(404, 'Not found');
	}

	return {
		preview,
		token: params.token
	};
};
