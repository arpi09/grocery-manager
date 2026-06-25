import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { predictReceiptLinesShelfLife } from './receipt-shelf-life-predictions';

vi.mock('$lib/server/feature-flags', () => ({
	isReceiptAiBatchEnabled: () => true,
	isGlobalShelfLifeDbEnabled: () => false
}));

vi.mock('$lib/server/openai', () => ({
	OPENAI_MODEL_NANO: 'gpt-test',
	requestStructuredJson: vi.fn()
}));

vi.mock('$lib/server/brain-metrics', () => ({
	logBrainMetrics: vi.fn()
}));

function createLearningEngine(
	predictions: Array<{
		expiresOn: string;
		typicalDays: number;
		expiresOnSource: 'default_heuristic' | 'household_learned';
		confidence: number;
	}>
): LearningEngineService {
	return {
		predictShelfLife: vi.fn(async (_householdId, input) => {
			const index = input.productName.includes('Ben') ? 1 : 0;
			const row = predictions[index] ?? predictions[0];
			return {
				expiresOn: row.expiresOn,
				typicalDays: row.typicalDays,
				expiresOnSource: row.expiresOnSource,
				confidence: row.confidence,
				modelVersion: 'test-v1',
				source: row.expiresOnSource === 'default_heuristic' ? 'location_default' : 'household_rule'
			};
		})
	} as unknown as LearningEngineService;
}

describe('predictReceiptLinesShelfLife GPT refinement', () => {
	beforeEach(async () => {
		const { requestStructuredJson } = await import('./openai');
		vi.mocked(requestStructuredJson).mockReset();
	});

	it('invokes GPT for default_heuristic lines and logs wasGptInvoked', async () => {
		const { requestStructuredJson } = await import('./openai');
		const { logBrainMetrics } = await import('./brain-metrics');

		vi.mocked(requestStructuredJson).mockResolvedValue({
			ok: true,
			data: {
				estimates: [{ index: 0, estimatedDays: 7, confidence: 0.7 }]
			}
		});

		const lines: ReceiptLine[] = [
			{ name: 'Okänd XYZ', location: 'fridge', categoryHint: null }
		];

		const learningEngine = createLearningEngine([
			{
				expiresOn: '2026-06-06',
				typicalDays: 5,
				expiresOnSource: 'default_heuristic',
				confidence: 0.25
			}
		]);

		const result = await predictReceiptLinesShelfLife(
			'house-1',
			lines,
			'2026-06-01',
			learningEngine,
			{ apiKey: 'test-key', clearCache: true }
		);

		expect(requestStructuredJson).toHaveBeenCalled();
		expect(result[0]?.expiresOnSource).toBe('ai_inferred');
		expect(vi.mocked(logBrainMetrics)).toHaveBeenCalledWith(
			'shelf_life_batch',
			expect.objectContaining({ wasGptInvoked: true })
		);
	});

	it('returns Ben & Jerry glass estimate >= 150 days from GPT batch', async () => {
		const { requestStructuredJson } = await import('./openai');

		vi.mocked(requestStructuredJson).mockResolvedValue({
			ok: true,
			data: {
				estimates: [{ index: 0, estimatedDays: 180, confidence: 0.82 }]
			}
		});

		const lines: ReceiptLine[] = [
			{
				name: "Ben & Jerry's Half Baked",
				location: 'freezer',
				brand: "Ben & Jerry's",
				categoryHint: 'glass'
			}
		];

		const learningEngine = createLearningEngine([
			{
				expiresOn: '2026-09-01',
				typicalDays: 90,
				expiresOnSource: 'default_heuristic',
				confidence: 0.25
			},
			{
				expiresOn: '2026-09-01',
				typicalDays: 90,
				expiresOnSource: 'default_heuristic',
				confidence: 0.25
			}
		]);

		const result = await predictReceiptLinesShelfLife(
			'house-1',
			lines,
			'2026-06-01',
			learningEngine,
			{ apiKey: 'test-key', clearCache: true }
		);

		expect(result[0]?.typicalDays).toBeGreaterThanOrEqual(150);
		expect(result[0]?.expiresOnSource).toBe('ai_inferred');
	});
});
