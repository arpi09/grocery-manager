import type { StorageLocation } from '$lib/domain/location';
import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';

export type PredictorId = 'shelf_life' | 'location' | 'replenishment';

export type PredictionSource = 'household_rule' | 'heuristic' | 'external_model' | 'location_default';

export type LearningFeedbackType = 'accepted' | 'corrected' | 'rejected' | 'ignored';

export interface PredictionContext {
	householdId: string;
}

export interface PredictionResult<T> {
	value: T;
	source: PredictionSource;
	confidence: number;
	modelVersion: string;
	explain?: string;
	sampleCount?: number;
	explanation?: PredictionExplanation;
}

export interface ShelfLifePredictionInput {
	productName: string;
	normalizedKey: string;
	location: StorageLocation;
	purchasedAt: string | null;
}

export interface ShelfLifePredictionValue {
	expiresOn: string;
	typicalDays: number;
}

export type ShelfLifeFeedbackSource =
	| 'receipt_scan'
	| 'kivra_forward'
	| 'inventory_edit'
	| 'consumption_velocity';

export interface ShelfLifeFeedbackContext {
	location: StorageLocation;
	purchasedAt?: string | null;
	productName?: string;
	importBatchId?: string | null;
	storeLabel?: string | null;
	source?: ShelfLifeFeedbackSource | null;
	unitPrice?: string | null;
	quantity?: string | null;
	unit?: string | null;
}

export interface ShelfLifeFeedbackEvent {
	householdId: string;
	userId: string;
	normalizedKey: string;
	context: ShelfLifeFeedbackContext;
	predictedExpiresOn: string | null;
	predictedTypicalDays: number | null;
	actualExpiresOn: string | null;
	feedbackType: LearningFeedbackType;
	modelVersion: string;
}

export interface ConsumptionVelocityFeedbackEvent {
	householdId: string;
	userId: string;
	normalizedKey: string;
	context: ShelfLifeFeedbackContext;
	predictedExpiresOn: string;
	predictedTypicalDays: number;
	consumedAt: string;
	observedTypicalDays: number;
	strength: 'strong' | 'weak';
	modelVersion: string;
}

export interface LocationPredictionInput {
	productName: string;
	normalizedKey: string;
}

export interface LocationPredictionValue {
	location: StorageLocation;
}

export interface LocationFeedbackContext {
	productName?: string;
	storeLabel?: string | null;
	source?: ShelfLifeFeedbackSource | null;
}

export interface LocationFeedbackEvent {
	householdId: string;
	userId: string;
	normalizedKey: string;
	context: LocationFeedbackContext;
	predictedLocation: StorageLocation;
	actualLocation: StorageLocation | null;
	feedbackType: LearningFeedbackType;
	modelVersion: string;
}

export interface PredictorFeedbackEvent {
	householdId: string;
	userId: string;
	predictorId: PredictorId;
	normalizedKey: string;
	feedbackType: LearningFeedbackType;
	contextJson?: Record<string, unknown>;
	predictedValue?: string;
	actualValue?: string | null;
	modelVersion?: string;
}
