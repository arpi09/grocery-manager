import { isThemePreference } from '$lib/domain/theme';
import { isUserEmailVerified } from '$lib/server/email-verification-enforcement';
import { isShoppingListShareEnabled } from '$lib/server/shopping-list-share-flag';
import { isShelfLifeEstimatesInReceiptEnabled } from '$lib/server/shelf-life-learning-flag';
import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { resolveThemeForRequest } from '$lib/server/theme-cookie';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
	const locale = locals.locale;
	const cookieConsent = readCookieConsent(cookies);

	const shelfLifeEstimatesInReceipt = isShelfLifeEstimatesInReceiptEnabled();

	if (!locals.user) {
		return {
			user: null,
			locale,
			themePreference: null,
			resolvedTheme: null,
			households: [],
			activeHousehold: null,
			householdRole: null,
			isPro: false,
			cookieConsent,
			staleCount: 0,
			activeInventoryCount: 0,
			shareLinkEnabled: false,
			shelfLifeEstimatesInReceipt
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

	const planTier = locals.planTier ?? DEFAULT_PLAN_TIER;

	let householdMemberCount = 0;
	if (locals.householdId && locals.user) {
		const household = await locals.householdService.getHouseholdForUser(locals.user.id);
		householdMemberCount = household?.members.length ?? 0;
	}

	let staleCount = 0;
	let activeInventoryCount = 0;
	if (locals.householdId) {
		try {
			staleCount = await locals.inventoryService.countStaleUndated(locals.householdId);
		} catch (error) {
			console.warn('[layout] staleCount degraded:', error);
		}
		try {
			activeInventoryCount = await locals.inventoryService.countActiveInventory(locals.householdId);
		} catch (error) {
			console.warn('[layout] activeInventoryCount degraded:', error);
		}
	}

	return {
		locale,
		cookieConsent,
		isPro: isProTier(planTier),
		user: {
			id: locals.user.id,
			email: locals.user.email,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			role: locals.user.role,
			petsEnabled: Boolean(locals.user.petsEnabled),
			isDemo: Boolean(locals.user.isDemo),
			emailVerified: isUserEmailVerified(locals.user)
		},
		themePreference: preference,
		resolvedTheme: resolved,
		households: householdsWithActive,
		activeHousehold: activeHousehold
			? { id: activeHousehold.id, name: activeHousehold.name }
			: null,
		householdRole: locals.householdRole,
		householdMemberCount,
		staleCount,
		activeInventoryCount,
		shareLinkEnabled: isShoppingListShareEnabled(),
		shelfLifeEstimatesInReceipt
	};
};
