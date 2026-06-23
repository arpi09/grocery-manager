import { describe, expect, it } from 'vitest';
import {
	INSIGHTS_LLM_MAX_INPUT_TOKENS,
	shouldFallbackInsightsHeuristic
} from '$lib/server/inventory-insights';

describe('insights token budget guard', () => {
	it('falls back when prompt exceeds max token estimate', () => {
		const hugePrompt = 'x'.repeat(INSIGHTS_LLM_MAX_INPUT_TOKENS * 4 + 1);
		expect(shouldFallbackInsightsHeuristic(hugePrompt, 10)).toBe(true);
	});

	it('allows LLM when prompt is within budget', () => {
		expect(shouldFallbackInsightsHeuristic('short prompt', 5)).toBe(false);
	});
});
