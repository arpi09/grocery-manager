import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { StorageLocation } from '$lib/domain/location';
import type { LearningFeedbackType } from '$lib/domain/learning/predictor-types';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isLocationLearningEnabled } from '$lib/server/location-learning-flag';

export interface LineLocationPredictionForm {
	predictedLocation: StorageLocation | null;
	modelVersion: string | null;
}

export function readLineLocationPrediction(formData: FormData, index: number): LineLocationPredictionForm {
	const predictedLocationRaw = formData.get(`predictedLocation_${index}`);
	const modelVersionRaw = formData.get(`predictedLocationModelVersion_${index}`);

	return {
		predictedLocation:
			typeof predictedLocationRaw === 'string' &&
			(predictedLocationRaw === 'fridge' ||
				predictedLocationRaw === 'freezer' ||
				predictedLocationRaw === 'cupboard')
				? predictedLocationRaw
				: null,
		modelVersion:
			typeof modelVersionRaw === 'string' && modelVersionRaw.trim() ? modelVersionRaw.trim() : null
	};
}

function resolveLocationFeedbackType(
	predictedLocation: StorageLocation,
	actualLocation: StorageLocation
): LearningFeedbackType {
	if (actualLocation === predictedLocation) return 'accepted';
	return 'corrected';
}

export async function recordLineLocationFeedback(params: {
	learningEngine: LearningEngineService;
	householdId: string;
	userId: string;
	productName: string;
	storeLabel?: string | null;
	prediction: LineLocationPredictionForm;
	actualLocation: StorageLocation;
}): Promise<void> {
	if (!isLocationLearningEnabled()) return;

	const predictedLocation = params.prediction.predictedLocation;
	if (!predictedLocation) return;

	const normalizedKey = normalizeReceiptProductName(params.productName);
	if (!normalizedKey) return;

	await params.learningEngine.recordLocationFeedback({
		householdId: params.householdId,
		userId: params.userId,
		normalizedKey,
		context: {
			productName: params.productName,
			storeLabel: params.storeLabel ?? null
		},
		predictedLocation,
		actualLocation: params.actualLocation,
		feedbackType: resolveLocationFeedbackType(predictedLocation, params.actualLocation),
		modelVersion: params.prediction.modelVersion ?? 'none'
	});
}
