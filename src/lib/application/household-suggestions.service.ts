import { formatNormalizedKeyForDisplay } from '$lib/domain/learning/display-key';
import { buildLocationExplanation } from '$lib/domain/learning/location-explanation';
import { sampleCountToConfidenceTier } from '$lib/domain/learning/memory-confidence';
import { buildShelfLifeExplanation } from '$lib/domain/learning/shelf-life-explanation';
import type { ConfidenceTier, PredictionExplanation } from '$lib/domain/learning/prediction-trust';
import type { StorageLocation } from '$lib/domain/location';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import type { IPurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';

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

export type MemoryFacetType = 'shelf_life' | 'location';

export interface MemoryFacetView {
	facetKey: string;
	type: MemoryFacetType;
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	typicalDays?: number;
	sampleCount: number;
	confidenceTier: ConfidenceTier;
	explanation: PredictionExplanation;
	lastUpdatedAt: string;
	correctItemId: string | null;
}

export interface HouseholdMemorySnapshot {
	memoryFacets: MemoryFacetView[];
	hasRules: boolean;
	receiptLineCount: number;
}

function formatMemoryDate(date: Date, locale: Locale): string {
	return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', {
		day: 'numeric',
		month: 'short'
	});
}

export class HouseholdSuggestionsService {
	constructor(
		private readonly shelfLifeRepository: IHouseholdShelfLifeRuleRepository,
		private readonly locationRepository: IHouseholdLocationRuleRepository,
		private readonly purchasePatternRepository: IPurchasePatternRepository
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

	async getMemorySnapshot(
		householdId: string,
		locale: Locale = DEFAULT_LOCALE
	): Promise<HouseholdMemorySnapshot> {
		const minSamples = 1;
		const [shelfLifeRows, locationRows, inventoryMatches, receiptLineCount] = await Promise.all([
			this.shelfLifeRepository.listByHousehold(householdId, minSamples),
			this.locationRepository.listByHousehold(householdId, minSamples),
			this.purchasePatternRepository.listActiveInventoryMatches(householdId),
			this.purchasePatternRepository.countReceiptLines(householdId)
		]);

		const itemIdByKey = new Map<string, string>();
		for (const match of inventoryMatches) {
			if (!itemIdByKey.has(match.normalizedKey)) {
				itemIdByKey.set(match.normalizedKey, match.id);
			}
		}

		const memoryFacets: MemoryFacetView[] = [];
		const sortLocale = locale === 'en' ? 'en' : 'sv';

		for (const row of shelfLifeRows) {
			const confidenceTier = sampleCountToConfidenceTier(row.sampleCount);
			if (!confidenceTier) continue;

			const displayName = formatNormalizedKeyForDisplay(row.normalizedKey);
			const lastUpdatedAt = formatMemoryDate(row.updatedAt, locale);

			memoryFacets.push({
				facetKey: `${row.normalizedKey}:${row.location}:shelf_life`,
				type: 'shelf_life',
				normalizedKey: row.normalizedKey,
				displayName,
				location: row.location,
				typicalDays: row.typicalDays,
				sampleCount: row.sampleCount,
				confidenceTier,
				explanation: buildShelfLifeExplanation(
					{
						templateId: 'shelf_life.household',
						normalizedKey: row.normalizedKey,
						displayName,
						sampleCount: row.sampleCount,
						location: row.location,
						typicalDays: row.typicalDays,
						lastUpdatedAt
					},
					locale
				),
				lastUpdatedAt,
				correctItemId: itemIdByKey.get(row.normalizedKey) ?? null
			});
		}

		for (const row of locationRows) {
			const confidenceTier = sampleCountToConfidenceTier(row.sampleCount);
			if (!confidenceTier) continue;

			const displayName = formatNormalizedKeyForDisplay(row.normalizedKey);
			const lastUpdatedAt = formatMemoryDate(row.updatedAt, locale);

			memoryFacets.push({
				facetKey: `${row.normalizedKey}:location`,
				type: 'location',
				normalizedKey: row.normalizedKey,
				displayName,
				location: row.location,
				sampleCount: row.sampleCount,
				confidenceTier,
				explanation: buildLocationExplanation(
					{
						templateId: 'location.household',
						normalizedKey: row.normalizedKey,
						displayName,
						sampleCount: row.sampleCount,
						location: row.location
					},
					locale
				),
				lastUpdatedAt,
				correctItemId: itemIdByKey.get(row.normalizedKey) ?? null
			});
		}

		memoryFacets.sort((a, b) => a.displayName.localeCompare(b.displayName, sortLocale));

		return {
			memoryFacets,
			hasRules: memoryFacets.length > 0,
			receiptLineCount
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

