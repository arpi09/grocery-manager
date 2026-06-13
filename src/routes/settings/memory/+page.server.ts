import { error, redirect } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { memoryActions } from '../memory.actions';
import { shouldShowSuggestionsSection } from '../suggestions.actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const householdId = locals.householdId;
	const householdRole = locals.householdRole;
	const locale = isLocale(locals.locale) ? locals.locale : DEFAULT_LOCALE;

	if (!user || !householdId || !householdRole) {
		throw error(403, 'Forbidden');
	}

	const memorySnapshot = await locals.householdSuggestionsService.getMemorySnapshot(
		householdId,
		locale
	);

	const showMemory = shouldShowSuggestionsSection(
		{ hasRules: memorySnapshot.hasRules },
		isShelfLifeLearningEnabled()
	);

	if (!showMemory) {
		throw redirect(302, '/settings');
	}

	return {
		user,
		memorySnapshot,
		canEdit: canEditInventory(householdRole)
	};
};

export const actions: Actions = {
	...memoryActions
};
