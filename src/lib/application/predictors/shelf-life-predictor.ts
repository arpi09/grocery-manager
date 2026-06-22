import type { Predictor } from '$lib/application/learning/ports/predictor.port';
import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';
import { buildShelfLifeExplanation } from '$lib/domain/learning/shelf-life-explanation';
import {
	computeExpiresOn,
	formatTodayIso,
	isHouseholdRuleReady,
	predictionSourceConfidence
} from '$lib/domain/learning/shelf-life-learning';
import type {
	PredictionContext,
	PredictionResult,
	ShelfLifePredictionInput,
	ShelfLifePredictionValue
} from '$lib/domain/learning/predictor-types';
import { predictHeuristicShelfLife } from '$lib/infrastructure/adapters/heuristic-shelf-life.adapter';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import {
	resolveLocationDefaultShelfLife,
	shelfLifeEstimateConfidence
} from '$lib/domain/shelf-life-estimate';

export class ShelfLifePredictor implements Predictor<ShelfLifePredictionInput, ShelfLifePredictionValue> {
	readonly id = 'shelf_life' as const;

	constructor(
		private readonly householdLearning: HouseholdLearningPort,
		private readonly options: {
			learningEnabled?: () => boolean;
			todayIso?: () => string;
		} = {}
	) {}

	async predict(
		ctx: PredictionContext,
		subject: ShelfLifePredictionInput
	): Promise<PredictionResult<ShelfLifePredictionValue> | null> {
		const todayIso = this.options.todayIso?.() ?? formatTodayIso();
		const learningEnabled = this.options.learningEnabled?.() ?? isShelfLifeLearningEnabled();

		if (learningEnabled) {
			const rule = await this.householdLearning.findShelfLifeRule(
				ctx.householdId,
				subject.normalizedKey,
				subject.location
			);
			if (rule && isHouseholdRuleReady(rule.sampleCount)) {
				const expiresOn = computeExpiresOn(rule.typicalDays, subject.purchasedAt, todayIso);
				const explanation = buildShelfLifeExplanation({
					templateId: 'shelf_life.household',
					normalizedKey: subject.normalizedKey,
					displayName: subject.productName,
					sampleCount: rule.sampleCount,
					location: subject.location,
					purchasedAt: subject.purchasedAt,
					typicalDays: rule.typicalDays
				});
				return {
					value: {
						expiresOn,
						typicalDays: rule.typicalDays
					},
					source: 'household_rule',
					confidence: predictionSourceConfidence('household_rule'),
					modelVersion: 'household-v1',
					explain: explanation.primary,
					sampleCount: rule.sampleCount,
					explanation
				};
			}
		}

		const heuristic = predictHeuristicShelfLife({
			productName: subject.productName,
			location: subject.location,
			purchasedAt: subject.purchasedAt,
			todayIso
		});
		if (heuristic) {
			const explanation = buildShelfLifeExplanation({
				templateId: 'shelf_life.heuristic',
				normalizedKey: subject.normalizedKey,
				displayName: subject.productName,
				location: subject.location,
				purchasedAt: subject.purchasedAt
			});
			return {
				value: {
					expiresOn: heuristic.expiresOn,
					typicalDays: heuristic.typicalDays
				},
				source: 'heuristic',
				confidence: predictionSourceConfidence('heuristic'),
				modelVersion: 'heuristic-v1',
				explain: explanation.primary,
				explanation
			};
		}

		const locationDefault = resolveLocationDefaultShelfLife({
			location: subject.location,
			purchasedAt: subject.purchasedAt,
			todayIso
		});
		const locationExplanation = buildShelfLifeExplanation({
			templateId: 'shelf_life.heuristic',
			normalizedKey: subject.normalizedKey,
			displayName: subject.productName,
			location: subject.location,
			purchasedAt: subject.purchasedAt,
			typicalDays: locationDefault.typicalDays
		});
		return {
			value: {
				expiresOn: locationDefault.expiresOn,
				typicalDays: locationDefault.typicalDays
			},
			source: 'location_default',
			confidence: shelfLifeEstimateConfidence('location_default'),
			modelVersion: 'location-default-v1',
			explain: locationExplanation.primary,
			explanation: locationExplanation
		};
	}
}
