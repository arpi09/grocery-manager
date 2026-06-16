import { canEditInventory } from '$lib/domain/household';
import { redirect } from '@sveltejs/kit';
import { buildKivraForwardAddress, isKivraForwardEnabled } from '$lib/server/kivra-forward';
import { receiptForwardService } from '$lib/server/di';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { shouldShowSuggestionsSection } from '../suggestions.actions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { householdId, householdRole } = await parent();

	const suggestionsSnapshot =
		householdId && householdRole && canEditInventory(householdRole)
			? await locals.householdSuggestionsService.getSnapshot(householdId)
			: { shelfLifeRules: [], locationRules: [], hasRules: false };

	const showSuggestions = shouldShowSuggestionsSection(
		suggestionsSnapshot,
		isShelfLifeLearningEnabled()
	);

	if (!showSuggestions) {
		throw redirect(302, '/settings');
	}

	const kivraForwardEnabled = isKivraForwardEnabled();
	const kivraForwardAddress =
		kivraForwardEnabled && householdId && householdRole && canEditInventory(householdRole)
			? buildKivraForwardAddress(await receiptForwardService.getForwardToken(householdId))
			: null;

	return {
		suggestionsSnapshot,
		canResetSuggestions: Boolean(householdRole && canEditInventory(householdRole)),
		kivraForwardAddress
	};
};
