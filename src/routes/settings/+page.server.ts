import { canEditInventory } from '$lib/domain/household';
import { buildKivraForwardAddress, isKivraForwardEnabled } from '$lib/server/kivra-forward';
import { receiptForwardService } from '$lib/server/di';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { billingActions } from './billing.actions';
import { shouldShowSuggestionsSection } from './suggestions.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { household, householdRole, isPro } = await parent();
	const householdId = locals.householdId;

	const kivraForwardEnabled = isKivraForwardEnabled();
	const kivraForwardAddress =
		kivraForwardEnabled && householdId && householdRole && canEditInventory(householdRole)
			? buildKivraForwardAddress(await receiptForwardService.getForwardToken(householdId))
			: null;

	const suggestionsSnapshot =
		householdId && householdRole && canEditInventory(householdRole)
			? await locals.householdSuggestionsService.getSnapshot(householdId)
			: { shelfLifeRules: [], locationRules: [], hasRules: false };

	const showSuggestions = shouldShowSuggestionsSection(
		suggestionsSnapshot,
		isShelfLifeLearningEnabled()
	);

	return {
		isPro,
		household,
		kivraForwardAddress,
		showSuggestions
	};
};

/** Legacy entry for PostOnboardingSurvey (`/settings?/submitProductFeedback`). */
export const actions: Actions = {
	submitProductFeedback: billingActions.submitProductFeedback
};
