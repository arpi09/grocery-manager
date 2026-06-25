import { getSnapshot, type BrainScoreSnapshot } from '$lib/domain/brain-score';
import type { Locale } from '$lib/i18n/locale';
import type { HouseholdSuggestionsService } from '$lib/application/household-suggestions.service';

export async function loadBrainScoreSnapshot(
	householdSuggestionsService: HouseholdSuggestionsService,
	householdId: string,
	locale: Locale
): Promise<BrainScoreSnapshot> {
	const [rules, memory] = await Promise.all([
		householdSuggestionsService.getSnapshot(householdId),
		householdSuggestionsService.getMemorySnapshot(householdId, locale)
	]);

	const feedbackCount = memory.memoryFacets.filter(
		(facet) => facet.feedbackStatus === 'confirmed' || facet.feedbackStatus === 'rejected'
	).length;

	return getSnapshot({
		ruleCount: rules.shelfLifeRules.length + rules.locationRules.length,
		feedbackCount,
		receiptLineCount: memory.receiptLineCount
	});
}
