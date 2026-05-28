import { isThemePreference } from '$lib/domain/theme';
import { resolveThemeForRequest } from '$lib/server/theme-cookie';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, request }) => {
	const storedPreference = locals.user?.themePreference;
	const { preference, resolved } = resolveThemeForRequest(
		{ cookies, request },
		isThemePreference(storedPreference ?? '') ? storedPreference : null
	);

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
			: null,
		themePreference: preference,
		resolvedTheme: resolved
	};
};
