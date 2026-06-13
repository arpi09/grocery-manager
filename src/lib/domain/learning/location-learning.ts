import type { StorageLocation } from '$lib/domain/location';
import type { LearningFeedbackType, PredictionSource } from '$lib/domain/learning/predictor-types';
import { predictionSourceConfidence } from '$lib/domain/learning/shelf-life-learning';

export const HOUSEHOLD_LOCATION_MIN_SAMPLES = 2;

export function isHouseholdLocationRuleReady(sampleCount: number): boolean {
	return sampleCount >= HOUSEHOLD_LOCATION_MIN_SAMPLES;
}

export function modelVersionForPredictionSource(source: PredictionSource): string {
	switch (source) {
		case 'household_rule':
			return 'household-v1';
		case 'heuristic':
			return 'heuristic-v1';
		case 'external_model':
			return 'external-v1';
	}
}

export function resolveLearnedLocation(
	feedbackType: LearningFeedbackType,
	predictedLocation: StorageLocation,
	actualLocation: StorageLocation | null
): StorageLocation | null {
	if (feedbackType === 'rejected' || feedbackType === 'ignored') return null;
	if (feedbackType === 'accepted') return predictedLocation;
	return actualLocation;
}

export { predictionSourceConfidence };
