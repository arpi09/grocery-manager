import type { StorageLocation } from '$lib/domain/location';

export interface HouseholdShelfLifeRuleSnapshot {
	typicalDays: number;
	sampleCount: number;
}

export interface HouseholdLocationRuleSnapshot {
	location: StorageLocation;
	sampleCount: number;
}

export interface HouseholdLearningPort {
	findShelfLifeRule(
		householdId: string,
		normalizedKey: string,
		location: StorageLocation
	): Promise<HouseholdShelfLifeRuleSnapshot | null>;

	upsertShelfLifeRule(input: {
		householdId: string;
		normalizedKey: string;
		location: StorageLocation;
		typicalDays: number;
		sampleCount: number;
		lastPredictedDays?: number | null;
	}): Promise<void>;

	findLocationRule(
		householdId: string,
		normalizedKey: string
	): Promise<HouseholdLocationRuleSnapshot | null>;

	upsertLocationRule(input: {
		householdId: string;
		normalizedKey: string;
		location: StorageLocation;
		sampleCount: number;
	}): Promise<void>;
}
