import { isThemePreference } from '$lib/domain/theme';
import { isUserEmailVerified } from '$lib/server/email-verification-enforcement';
import { isShoppingListShareEnabled } from '$lib/server/shopping-list-share-flag';
import { isShelfLifeEstimatesInReceiptEnabled } from '$lib/server/shelf-life-learning-flag';
import { isHomeRedesignV1Enabled } from '$lib/server/home-redesign-flag';
import { isPriceMemoryV1Enabled } from '$lib/server/price-memory-flag';
import { isBrainFeedbackV1Enabled } from '$lib/server/brain-feedback-flag';
import { DEFAULT_PLAN_TIER, isProTier } from '$lib/domain/plan';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { resolveThemeForRequest } from '$lib/server/theme-cookie';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
	const locale = locals.locale;
	const cookieConsent = readCookieConsent(cookies);

	const shelfLifeEstimatesInReceipt = isShelfLifeEstimatesInReceiptEnabled();
	const homeRedesignV1Enabled = isHomeRedesignV1Enabled();
	const priceMemoryV1Enabled = isPriceMemoryV1Enabled();
	const brainFeedbackV1Enabled = isBrainFeedbackV1Enabled();

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
			shelfLifeEstimatesInReceipt,
			homeRedesignV1Enabled,
			priceMemoryV1Enabled,
			brainFeedbackV1Enabled
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
		shelfLifeEstimatesInReceipt,
		homeRedesignV1Enabled,
		priceMemoryV1Enabled,
		brainFeedbackV1Enabled
	};
};
