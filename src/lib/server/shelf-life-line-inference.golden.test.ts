import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { inferShelfLifeWithRefinement } from '$lib/server/shelf-life-line-inference';

vi.mock('$lib/server/shelf-life-learning-flag', () => ({
	isShelfLifeLearningEnabled: () => true
}));

vi.mock('$lib/server/feature-flags', () => ({
	isReceiptAiBatchEnabled: () => true
}));

vi.mock('$lib/server/openai', () => ({
	getOpenAiApiKey: () => 'test-key'
}));

const frozenGlassLlm = {
	expiresOn: '2026-12-31',
	typicalDays: 365,
	confidence: 0.9
};

vi.mock('$lib/server/receipt-shelf-life-predictions', () => ({
	inferShelfLifeSingleLlm: vi.fn(async () => frozenGlassLlm)
}));

describe('inferShelfLifeWithRefinement scan path parity', () => {
	const learningEngine = {
		predictShelfLife: vi.fn(async () => ({
			expiresOn: '2026-06-10',
			expiresOnSource: 'default_heuristic' as const,
			typicalDays: 7,
			modelVersion: 'heuristic-v1',
			confidence: 0.3,
			source: 'default_heuristic'
		}))
	} as unknown as LearningEngineService;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('refines low-confidence freezer items via single LLM (frozen glass golden)', async () => {
		const result = await inferShelfLifeWithRefinement({
			learningEngine,
			householdId: 'hh-1',
			name: 'Glass vanilj',
			location: 'freezer',
			purchasedAt: '2026-06-01',
			apiKey: 'test-key'
		});

		expect(result).not.toBeNull();
		expect(result?.expiresOn).toBe(frozenGlassLlm.expiresOn);
		expect(result?.expiresOnSource).toBe('ai_inferred');
		expect(result?.inferPath).toBe('single_llm');
		expect(result?.typicalDays).toBe(365);
	});
});
