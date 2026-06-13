import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { StorageLocation } from '$lib/domain/location';
import type {
	LearningFeedbackType,
	ShelfLifeFeedbackSource
} from '$lib/domain/learning/predictor-types';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';

export interface LineShelfLifePredictionForm {
	predictedExpiresOn: string | null;
	predictedTypicalDays: number | null;
	modelVersion: string | null;
}

export function readLineShelfLifePrediction(formData: FormData, index: number): LineShelfLifePredictionForm {
	const predictedExpiresOnRaw = formData.get(`predictedExpiresOn_${index}`);
	const predictedTypicalDaysRaw = formData.get(`predictedTypicalDays_${index}`);
	const modelVersionRaw = formData.get(`predictedModelVersion_${index}`);

	return {
		predictedExpiresOn:
			typeof predictedExpiresOnRaw === 'string' && predictedExpiresOnRaw.trim()
				? predictedExpiresOnRaw.trim()
				: null,
		predictedTypicalDays:
			typeof predictedTypicalDaysRaw === 'string' && predictedTypicalDaysRaw.trim()
				? Number(predictedTypicalDaysRaw)
				: null,
		modelVersion:
			typeof modelVersionRaw === 'string' && modelVersionRaw.trim() ? modelVersionRaw.trim() : null
	};
}

function resolveFeedbackType(
	predictedExpiresOn: string | null,
	actualExpiresOn: string | null,
	userProvidedExpiresOn: boolean
): LearningFeedbackType | null {
	if (!predictedExpiresOn) return null;
	if (!userProvidedExpiresOn) return 'accepted';
	if (!actualExpiresOn) return 'rejected';
	if (actualExpiresOn === predictedExpiresOn) return 'accepted';
	return 'corrected';
}

export async function recordLineShelfLifeFeedback(params: {
	learningEngine: LearningEngineService;
	householdId: string;
	userId: string;
	productName: string;
	location: StorageLocation;
	purchasedAt: string | null;
	importBatchId?: string | null;
	storeLabel?: string | null;
	feedbackSource: ShelfLifeFeedbackSource;
	prediction: LineShelfLifePredictionForm;
	actualExpiresOn: string | null;
	userProvidedExpiresOn: boolean;
	quantity?: string | null;
	unit?: string | null;
	unitPrice?: string | null;
}): Promise<void> {
	if (!isShelfLifeLearningEnabled()) return;

	const normalizedKey = normalizeReceiptProductName(params.productName);
	if (!normalizedKey) return;

	const feedbackType = resolveFeedbackType(
		params.prediction.predictedExpiresOn,
		params.actualExpiresOn,
		params.userProvidedExpiresOn
	);
	if (!feedbackType) return;

	await params.learningEngine.recordFeedback({
		householdId: params.householdId,
		userId: params.userId,
		normalizedKey,
		context: {
			location: params.location,
			purchasedAt: params.purchasedAt,
			productName: params.productName,
			importBatchId: params.importBatchId ?? null,
			storeLabel: params.storeLabel ?? null,
			source: params.feedbackSource,
			quantity: params.quantity ?? null,
			unit: params.unit ?? null,
			unitPrice: params.unitPrice ?? null
		},
		predictedExpiresOn: params.prediction.predictedExpiresOn,
		predictedTypicalDays: Number.isFinite(params.prediction.predictedTypicalDays)
			? params.prediction.predictedTypicalDays
			: null,
		actualExpiresOn: params.actualExpiresOn,
		feedbackType,
		modelVersion: params.prediction.modelVersion ?? 'none'
	});
}
