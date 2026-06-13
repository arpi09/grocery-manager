import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';

export class HouseholdLearningAdapter implements HouseholdLearningPort {
	constructor(
		private readonly shelfLifeRepository: IHouseholdShelfLifeRuleRepository,
		private readonly locationRepository: IHouseholdLocationRuleRepository
	) {}

	async findShelfLifeRule(
		householdId: string,
		normalizedKey: string,
		location: Parameters<HouseholdLearningPort['findShelfLifeRule']>[2]
	) {
		const rule = await this.shelfLifeRepository.findByKey(householdId, normalizedKey, location);
		if (!rule) return null;
		return {
			typicalDays: rule.typicalDays,
			sampleCount: rule.sampleCount
		};
	}

	async upsertShelfLifeRule(
		input: Parameters<HouseholdLearningPort['upsertShelfLifeRule']>[0]
	): Promise<void> {
		await this.shelfLifeRepository.upsert({
			householdId: input.householdId,
			normalizedKey: input.normalizedKey,
			location: input.location,
			typicalDays: input.typicalDays,
			sampleCount: input.sampleCount,
			lastPredictedDays: input.lastPredictedDays ?? null
		});
	}

	async findLocationRule(householdId: string, normalizedKey: string) {
		const rule = await this.locationRepository.findByKey(householdId, normalizedKey);
		if (!rule) return null;
		return {
			location: rule.location,
			sampleCount: rule.sampleCount
		};
	}

	async upsertLocationRule(
		input: Parameters<HouseholdLearningPort['upsertLocationRule']>[0]
	): Promise<void> {
		await this.locationRepository.upsert({
			householdId: input.householdId,
			normalizedKey: input.normalizedKey,
			location: input.location,
			sampleCount: input.sampleCount
		});
	}
}
