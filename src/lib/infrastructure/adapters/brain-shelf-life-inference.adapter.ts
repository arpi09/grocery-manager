import type { ShelfLifeInferencePort } from '$lib/application/ports/shelf-life-inference.port';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { inferShelfLifeWithRefinement } from '$lib/server/shelf-life-line-inference';
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

			const inferred = await inferShelfLifeWithRefinement({
				learningEngine,
				householdId: input.householdId,
				name: input.name,
				location: input.location,
				purchasedAt: input.purchasedAt ?? null
			});
			if (!inferred) return inferShelfLifeHeuristic(input);

			return {
				expiresOn: inferred.expiresOn,
				source: inferred.expiresOnSource
			};
		}
	};
}
