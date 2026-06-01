import { isThemePreference } from '$lib/domain/theme';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { resolveThemeForRequest } from '$lib/server/theme-cookie';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
	const locale = locals.locale;
	const cookieConsent = readCookieConsent(cookies);

	if (!locals.user) {
		return {
			user: null,
			locale,
			themePreference: null,
			resolvedTheme: null,
			households: [],
			activeHousehold: null,
			householdRole: null,
			cookieConsent
		};
	}

	const rawPreference = locals.user.themePreference;
	const storedPreference =
		rawPreference && isThemePreference(rawPreference) ? rawPreference : 'system';
	const { preference, resolved } = resolveThemeForRequest({ request }, storedPreference);

	const households = await locals.householdService.listHouseholdsForUser(locals.user.id);
	const activeId = locals.householdId;
	const activeHousehold =
		households.find((h) => h.id === activeId) ??
		(activeId && households.length > 0
			? { id: activeId, name: 'Pantry', role: locals.householdRole ?? 'viewer', isActive: true }
			: null);

	const householdsWithActive = households.map((h) => ({
		...h,
		isActive: h.id === activeId
	}));

	return {
		locale,
		cookieConsent,
		user: {
			id: locals.user.id,
			email: locals.user.email,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			role: locals.user.role,
			petsEnabled: Boolean(locals.user.petsEnabled)
		},
		themePreference: preference,
		resolvedTheme: resolved,
		households: householdsWithActive,
		activeHousehold: activeHousehold
			? { id: activeHousehold.id, name: activeHousehold.name }
			: null,
		householdRole: locals.householdRole
	};
};
