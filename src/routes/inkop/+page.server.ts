import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					petsEnabled: locals.user.petsEnabled,
					role: locals.user.role
				}
			: null
	};
};
