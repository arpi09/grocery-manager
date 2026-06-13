import type { ExpiresOnSource } from '$lib/domain/auto-expired';

import type { HouseholdLearningPort } from '$lib/application/learning/ports/household-learning.port';

import type { LearningFeedbackPort } from '$lib/application/learning/ports/learning-feedback.port';

import { LocationPredictor } from '$lib/application/predictors/location-predictor';

import { ShelfLifePredictor } from '$lib/application/predictors/shelf-life-predictor';

import { resolveLearnedLocation } from '$lib/domain/learning/location-learning';

import {

	computeTypicalDaysFromDates,

	formatTodayIso,

	predictionSourceToExpiresOnSource,

	updateMaterializedMedian

} from '$lib/domain/learning/shelf-life-learning';

import type {

	ConsumptionVelocityFeedbackEvent,

	LocationFeedbackEvent,

	LocationPredictionInput,

	LocationPredictionValue,

	PredictorFeedbackEvent,

	ShelfLifeFeedbackEvent,

	ShelfLifePredictionInput,

	ShelfLifePredictionValue

} from '$lib/domain/learning/predictor-types';

import type { PredictionResult } from '$lib/domain/learning/predictor-types';

import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';

import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';



export interface ShelfLifePrediction extends ShelfLifePredictionValue {

	expiresOnSource: ExpiresOnSource;

	source: PredictionResult<ShelfLifePredictionValue>['source'];

	confidence: number;

	modelVersion: string;

	explain?: string;

	explanation?: PredictionExplanation;

}



export interface LocationPrediction extends LocationPredictionValue {

	source: PredictionResult<LocationPredictionValue>['source'];

	confidence: number;

	modelVersion: string;

	explain?: string;

	explanation?: PredictionExplanation;

}



export class LearningEngineService {

	private readonly shelfLifePredictor: ShelfLifePredictor;

	private readonly locationPredictor: LocationPredictor;



	constructor(

		householdLearning: HouseholdLearningPort,

		learningFeedback: LearningFeedbackPort,

		options: {

			todayIso?: () => string;

			learningEnabled?: () => boolean;

			locationLearningEnabled?: () => boolean;

			replenishmentLearningEnabled?: () => boolean;

		} = {}

	) {

		this.shelfLifePredictor = new ShelfLifePredictor(householdLearning, options);

		this.locationPredictor = new LocationPredictor(householdLearning, {

			learningEnabled: options.locationLearningEnabled ?? options.learningEnabled

		});

		this.learningFeedback = learningFeedback;

		this.householdLearning = householdLearning;

		this.todayIso = options.todayIso ?? formatTodayIso;

		this.learningEnabled = options.learningEnabled ?? (() => false);

		this.locationLearningEnabled = options.locationLearningEnabled ?? (() => false);

		this.replenishmentLearningEnabled = options.replenishmentLearningEnabled ?? (() => false);

	}



	private readonly householdLearning: HouseholdLearningPort;

	private readonly learningFeedback: LearningFeedbackPort;

	private readonly todayIso: () => string;

	private readonly learningEnabled: () => boolean;

	private readonly locationLearningEnabled: () => boolean;

	private readonly replenishmentLearningEnabled: () => boolean;



	async predictShelfLife(

		householdId: string,

		input: ShelfLifePredictionInput

	): Promise<ShelfLifePrediction | null> {

		const normalizedKey = input.normalizedKey || normalizeReceiptProductName(input.productName);

		if (!normalizedKey) return null;



		const result = await this.shelfLifePredictor.predict(

			{ householdId },

			{ ...input, normalizedKey }

		);

		if (!result) return null;



		return {

			...result.value,

			expiresOnSource: predictionSourceToExpiresOnSource(result.source),

			source: result.source,

			confidence: result.confidence,

			modelVersion: result.modelVersion,

			explain: result.explain,

			explanation: result.explanation

		};

	}



	async predictLocation(

		householdId: string,

		input: LocationPredictionInput

	): Promise<LocationPrediction | null> {

		const normalizedKey = input.normalizedKey || normalizeReceiptProductName(input.productName);

		if (!normalizedKey) return null;



		const result = await this.locationPredictor.predict(

			{ householdId },

			{ ...input, normalizedKey }

		);

		if (!result) return null;



		return {

			...result.value,

			source: result.source,

			confidence: result.confidence,

			modelVersion: result.modelVersion,

			explain: result.explain,

			explanation: result.explanation

		};

	}



	async recordFeedback(event: ShelfLifeFeedbackEvent): Promise<void> {

		const normalizedKey = event.normalizedKey || normalizeReceiptProductName(event.context.productName ?? '');

		if (!normalizedKey) return;



		await this.learningFeedback.insert({

			householdId: event.householdId,

			userId: event.userId,

			predictorId: 'shelf_life',

			subjectKey: normalizedKey,

			contextJson: {

				location: event.context.location,

				purchasedAt: event.context.purchasedAt ?? null,

				productName: event.context.productName ?? null,

				importBatchId: event.context.importBatchId ?? null,

				storeLabel: event.context.storeLabel ?? null,

				source: event.context.source ?? null,

				unitPrice: event.context.unitPrice ?? null,

				quantity: event.context.quantity ?? null,

				unit: event.context.unit ?? null

			},

			predictedValue: event.predictedExpiresOn ?? '',

			actualValue: event.actualExpiresOn,

			feedbackType: event.feedbackType,

			modelVersion: event.modelVersion

		});



		if (!this.learningEnabled() || event.feedbackType === 'rejected' || event.feedbackType === 'ignored') {

			return;

		}



		const referenceDate = event.context.purchasedAt ?? this.todayIso();

		let observedDays: number | null = null;



		if (event.feedbackType === 'corrected' && event.actualExpiresOn) {

			observedDays = computeTypicalDaysFromDates(referenceDate, event.actualExpiresOn);

		} else if (event.feedbackType === 'accepted') {

			const expiresOn = event.actualExpiresOn ?? event.predictedExpiresOn;

			if (expiresOn) {

				observedDays = computeTypicalDaysFromDates(referenceDate, expiresOn);

			} else if (event.predictedTypicalDays != null) {

				observedDays = event.predictedTypicalDays;

			}

		}



		if (observedDays == null || observedDays < 0) return;



		const existing = await this.householdLearning.findShelfLifeRule(

			event.householdId,

			normalizedKey,

			event.context.location

		);



		const typicalDays = existing

			? updateMaterializedMedian(existing.typicalDays, existing.sampleCount, observedDays)

			: observedDays;

		const sampleCount = (existing?.sampleCount ?? 0) + 1;



		await this.householdLearning.upsertShelfLifeRule({

			householdId: event.householdId,

			normalizedKey,

			location: event.context.location,

			typicalDays,

			sampleCount,

			lastPredictedDays: event.predictedTypicalDays

		});

	}



	async recordConsumptionVelocityFeedback(event: ConsumptionVelocityFeedbackEvent): Promise<void> {

		const normalizedKey = event.normalizedKey || normalizeReceiptProductName(event.context.productName ?? '');

		if (!normalizedKey) return;



		const feedbackType = event.strength === 'strong' ? 'corrected' : 'accepted';



		await this.learningFeedback.insert({

			householdId: event.householdId,

			userId: event.userId,

			predictorId: 'shelf_life',

			subjectKey: normalizedKey,

			contextJson: {

				location: event.context.location,

				purchasedAt: event.context.purchasedAt ?? null,

				productName: event.context.productName ?? null,

				importBatchId: event.context.importBatchId ?? null,

				storeLabel: event.context.storeLabel ?? null,

				source: event.context.source ?? 'consumption_velocity',

				unitPrice: event.context.unitPrice ?? null,

				quantity: event.context.quantity ?? null,

				unit: event.context.unit ?? null,

				consumedAt: event.consumedAt,

				observedTypicalDays: event.observedTypicalDays,

				signalStrength: event.strength

			},

			predictedValue: event.predictedExpiresOn,

			actualValue: event.consumedAt,

			feedbackType,

			modelVersion: event.modelVersion

		});



		if (!this.learningEnabled() || event.strength !== 'strong') {

			return;

		}



		const observedDays = event.observedTypicalDays;

		if (observedDays < 0) return;



		const existing = await this.householdLearning.findShelfLifeRule(

			event.householdId,

			normalizedKey,

			event.context.location

		);



		const typicalDays = existing

			? updateMaterializedMedian(existing.typicalDays, existing.sampleCount, observedDays)

			: observedDays;

		const sampleCount = (existing?.sampleCount ?? 0) + 1;



		await this.householdLearning.upsertShelfLifeRule({

			householdId: event.householdId,

			normalizedKey,

			location: event.context.location,

			typicalDays,

			sampleCount,

			lastPredictedDays: event.predictedTypicalDays

		});

	}



	async recordLocationFeedback(event: LocationFeedbackEvent): Promise<void> {

		const normalizedKey = event.normalizedKey || normalizeReceiptProductName(event.context.productName ?? '');

		if (!normalizedKey) return;



		await this.learningFeedback.insert({

			householdId: event.householdId,

			userId: event.userId,

			predictorId: 'location',

			subjectKey: normalizedKey,

			contextJson: {

				productName: event.context.productName ?? null,

				storeLabel: event.context.storeLabel ?? null

			},

			predictedValue: event.predictedLocation,

			actualValue: event.actualLocation,

			feedbackType: event.feedbackType,

			modelVersion: event.modelVersion

		});



		if (

			!this.locationLearningEnabled() ||

			event.feedbackType === 'rejected' ||

			event.feedbackType === 'ignored'

		) {

			return;

		}



		const learnedLocation = resolveLearnedLocation(

			event.feedbackType,

			event.predictedLocation,

			event.actualLocation

		);

		if (!learnedLocation) return;



		const existing = await this.householdLearning.findLocationRule(event.householdId, normalizedKey);

		const sampleCount = (existing?.sampleCount ?? 0) + 1;



		await this.householdLearning.upsertLocationRule({

			householdId: event.householdId,

			normalizedKey,

			location: learnedLocation,

			sampleCount

		});

	}



	async recordPredictorFeedback(event: PredictorFeedbackEvent): Promise<void> {

		if (event.predictorId === 'replenishment' && !this.replenishmentLearningEnabled()) {

			return;

		}



		const normalizedKey =

			event.normalizedKey ||

			normalizeReceiptProductName(

				typeof event.contextJson?.productName === 'string' ? event.contextJson.productName : ''

			);

		if (!normalizedKey) return;



		await this.learningFeedback.insert({

			householdId: event.householdId,

			userId: event.userId,

			predictorId: event.predictorId,

			subjectKey: normalizedKey,

			contextJson: event.contextJson ?? {},

			predictedValue: event.predictedValue ?? normalizedKey,

			actualValue: event.actualValue ?? null,

			feedbackType: event.feedbackType,

			modelVersion: event.modelVersion ?? `${event.predictorId}-v1`

		});

	}

}

