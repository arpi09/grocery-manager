import { formatNormalizedKeyForDisplay } from '$lib/domain/learning/display-key';
import type { StorageLocation } from '$lib/domain/location';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';

export interface ShelfLifeSuggestionView {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
}

export interface LocationSuggestionView {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	sampleCount: number;
}

export interface HouseholdSuggestionsSnapshot {
	shelfLifeRules: ShelfLifeSuggestionView[];
	locationRules: LocationSuggestionView[];
	hasRules: boolean;
}

export class HouseholdSuggestionsService {
	constructor(
		private readonly shelfLifeRepository: IHouseholdShelfLifeRuleRepository,
		private readonly locationRepository: IHouseholdLocationRuleRepository
	) {}

	async getSnapshot(householdId: string): Promise<HouseholdSuggestionsSnapshot> {
		const [shelfLifeRows, locationRows] = await Promise.all([
			this.shelfLifeRepository.listByHousehold(householdId, 1),
			this.locationRepository.listByHousehold(householdId, 1)
		]);

		const shelfLifeRules = shelfLifeRows
			.map((row) => ({
				normalizedKey: row.normalizedKey,
				displayName: formatNormalizedKeyForDisplay(row.normalizedKey),
				location: row.location,
				typicalDays: row.typicalDays,
				sampleCount: row.sampleCount
			}))
			.sort((a, b) => a.displayName.localeCompare(b.displayName, 'sv'));

		const locationRules = locationRows
			.map((row) => ({
				normalizedKey: row.normalizedKey,
				displayName: formatNormalizedKeyForDisplay(row.normalizedKey),
				location: row.location,
				sampleCount: row.sampleCount
			}))
			.sort((a, b) => a.displayName.localeCompare(b.displayName, 'sv'));

		return {
			shelfLifeRules,
			locationRules,
			hasRules: shelfLifeRules.length > 0 || locationRules.length > 0
		};
	}

	async resetShelfLifeRule(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<boolean> {
		return this.shelfLifeRepository.delete(householdId, normalizedKey, location);
	}

	async resetLocationRule(householdId: string, normalizedKey: string): Promise<boolean> {
		return this.locationRepository.delete(householdId, normalizedKey);
	}
}
