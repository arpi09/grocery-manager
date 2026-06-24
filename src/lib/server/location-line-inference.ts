import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { StorageLocation } from '$lib/domain/location';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isLocationLearningEnabled } from '$lib/server/feature-flags';

export interface InferredLineLocation {
	location: StorageLocation;
	modelVersion: string;
}

export async function inferLineLocation(
	learningEngine: LearningEngineService,
	householdId: string,
	name: string
): Promise<InferredLineLocation | null> {
	if (!isLocationLearningEnabled()) return null;

	const normalizedKey = normalizeReceiptProductName(name);
	if (!normalizedKey) return null;

	const prediction = await learningEngine.predictLocation(householdId, {
		productName: name,
		normalizedKey
	});
	if (!prediction) return null;

	return {
		location: prediction.location,
		modelVersion: prediction.modelVersion
	};
}
