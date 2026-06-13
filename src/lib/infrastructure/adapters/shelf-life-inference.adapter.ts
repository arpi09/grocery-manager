import type { ShelfLifeInferencePort } from '$lib/application/ports/shelf-life-inference.port';
import { inferShelfLifeHeuristic } from '$lib/server/shelf-life-inference';

export const shelfLifeInferenceAdapter: ShelfLifeInferencePort = {
	inferShelfLife: inferShelfLifeHeuristic
};
