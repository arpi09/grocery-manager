import type { Predictor } from '$lib/application/learning/ports/predictor.port';
import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';
import { guessStorageLocation } from '$lib/domain/guess-storage-location';
import { buildLocationExplanation } from '$lib/domain/learning/location-explanation';
import {
	isHouseholdLocationRuleReady,
	predictionSourceConfidence
} from '$lib/domain/learning/location-learning';
import type {
	LocationPredictionInput,
	LocationPredictionValue,
	PredictionContext,
	PredictionResult
} from '$lib/domain/learning/predictor-types';
import { isLocationLearningEnabled } from '$lib/server/feature-flags';

export class LocationPredictor implements Predictor<LocationPredictionInput, LocationPredictionValue> {
	readonly id = 'location' as const;

	constructor(
		private readonly householdLearning: HouseholdLearningPort,
		private readonly options: {
			learningEnabled?: () => boolean;
			llmEnabled?: () => boolean;
		} = {}
	) {}

	async predict(
		ctx: PredictionContext,
		subject: LocationPredictionInput
	): Promise<PredictionResult<LocationPredictionValue> | null> {
		const learningEnabled = this.options.learningEnabled?.() ?? isLocationLearningEnabled();

		if (learningEnabled) {
			const rule = await this.householdLearning.findLocationRule(
				ctx.householdId,
				subject.normalizedKey
			);
			if (rule && isHouseholdLocationRuleReady(rule.sampleCount)) {
				const explanation = buildLocationExplanation({
					templateId: 'location.household',
					normalizedKey: subject.normalizedKey,
					displayName: subject.productName,
					sampleCount: rule.sampleCount,
					location: rule.location
				});
				return {
					value: { location: rule.location },
					source: 'household_rule',
					confidence: predictionSourceConfidence('household_rule'),
					modelVersion: 'household-v1',
					explain: explanation.primary,
					sampleCount: rule.sampleCount,
					explanation
				};
			}
		}

		const heuristicLocation = guessStorageLocation(subject.productName);
		const explanation = buildLocationExplanation({
			templateId: 'location.heuristic',
			normalizedKey: subject.normalizedKey,
			displayName: subject.productName,
			location: heuristicLocation
		});
		return {
			value: { location: heuristicLocation },
			source: 'heuristic',
			confidence: predictionSourceConfidence('heuristic'),
			modelVersion: 'heuristic-v1',
			explain: explanation.primary,
			explanation
		};
	}
}
