import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import { guessShelfLife } from '$lib/domain/shelf-life';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';

export interface InferredLineShelfLife {
	expiresOn: string;
	expiresOnSource: ExpiresOnSource;
	typicalDays: number | null;
	modelVersion: string;
}

export async function inferLineShelfLife(
	learningEngine: LearningEngineService,
	householdId: string,
	name: string,
	location: StorageLocation,
	purchasedAt: string | null
): Promise<InferredLineShelfLife | null> {
	if (!isShelfLifeLearningEnabled()) {
		const inferred = guessShelfLife(name, location);
		if (!inferred) return null;
		return {
			expiresOn: inferred.expiresOn,
			expiresOnSource: 'ai_inferred',
			typicalDays: null,
			modelVersion: 'heuristic-legacy'
		};
	}

	const normalizedKey = normalizeReceiptProductName(name);
	if (!normalizedKey) return null;

	const prediction = await learningEngine.predictShelfLife(householdId, {
		productName: name,
		normalizedKey,
		location,
		purchasedAt
	});
	if (!prediction) return null;

	return {
		expiresOn: prediction.expiresOn,
		expiresOnSource: prediction.expiresOnSource,
		typicalDays: prediction.typicalDays,
		modelVersion: prediction.modelVersion
	};
}
