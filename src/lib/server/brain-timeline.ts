import {
	buildBrainTimelineEntries,
	type BrainTimelineEntry
} from '$lib/domain/brain-timeline';
import {
	householdLocationRuleRepository,
	householdShelfLifeRuleRepository,
	pmfRepository
} from '$lib/server/di';

const TIMELINE_LOOKBACK_DAYS = 30;

export async function loadBrainTimeline(householdId: string): Promise<BrainTimelineEntry[]> {
	const since = new Date();
	since.setDate(since.getDate() - TIMELINE_LOOKBACK_DAYS);

	const [shelfLifeRules, locationRules, events] = await Promise.all([
		householdShelfLifeRuleRepository.listByHousehold(householdId, 2),
		householdLocationRuleRepository.listByHousehold(householdId, 2),
		pmfRepository.listBrainTimelineEvents(householdId, since, 20)
	]);

	return buildBrainTimelineEntries({
		shelfLifeRules: shelfLifeRules.map((rule) => ({
			normalizedKey: rule.normalizedKey,
			location: rule.location,
			typicalDays: rule.typicalDays,
			sampleCount: rule.sampleCount,
			updatedAt: rule.updatedAt
		})),
		locationRules: locationRules.map((rule) => ({
			normalizedKey: rule.normalizedKey,
			location: rule.location,
			sampleCount: rule.sampleCount,
			updatedAt: rule.updatedAt
		})),
		events
	});
}
