import type { ExpiresOnSource } from '$lib/domain/auto-expired';

/** Below this confidence, shelf-life should be refined by GPT batch/single-call. */
export const SHELF_LIFE_LLM_REFINEMENT_THRESHOLD = 0.55;

export function needsShelfLifeLlmRefinement(input: {
	expiresOnSource: ExpiresOnSource;
	confidence?: number | null;
}): boolean {
	if (input.expiresOnSource === 'default_heuristic') return true;
	if (input.confidence != null && input.confidence < SHELF_LIFE_LLM_REFINEMENT_THRESHOLD) {
		return true;
	}
	return false;
}
