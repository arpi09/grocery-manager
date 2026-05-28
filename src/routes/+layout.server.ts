import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					email: locals.user.email,
					displayName: locals.user.displayName,
					avatarUrl: locals.user.avatarUrl,
					role: locals.user.role,
					petsEnabled: Boolean(locals.user.petsEnabled)
				}
			: null
	};
};
