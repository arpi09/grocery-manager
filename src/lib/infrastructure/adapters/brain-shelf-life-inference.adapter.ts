import type { ShelfLifeInferencePort } from '$lib/application/ports/shelf-life-inference.port';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { inferShelfLifeHeuristic } from '$lib/server/shelf-life-inference';

export function createBrainShelfLifeInferenceAdapter(
	learningEngine: LearningEngineService
): ShelfLifeInferencePort {
	return {
		async inferShelfLife(input) {
			if (!isShelfLifeLearningEnabled() || !input.householdId) {
				return inferShelfLifeHeuristic(input);
			}

			const normalizedKey = normalizeReceiptProductName(input.name);
			if (!normalizedKey) return inferShelfLifeHeuristic(input);

			const prediction = await learningEngine.predictShelfLife(input.householdId, {
				productName: input.name,
				normalizedKey,
				location: input.location,
				purchasedAt: input.purchasedAt ?? null
			});
			if (!prediction) return inferShelfLifeHeuristic(input);

			return {
				expiresOn: prediction.expiresOn,
				source: prediction.expiresOnSource
			};
		}
	};
}
