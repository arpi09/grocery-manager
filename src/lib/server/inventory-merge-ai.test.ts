import { describe, expect, it, vi, beforeEach } from 'vitest';
import { confirmSameProductMerge } from './inventory-merge-ai';

vi.mock('./openai', () => ({
	OPENAI_MODEL_NANO: 'gpt-4.1-nano',
	requestStructuredJson: vi.fn()
}));

describe('confirmSameProductMerge', () => {
	beforeEach(async () => {
		const { requestStructuredJson } = await import('./openai');
		vi.mocked(requestStructuredJson).mockReset();
	});
	it('returns true when model confirms same product', async () => {
		const { requestStructuredJson } = await import('./openai');
		vi.mocked(requestStructuredJson).mockResolvedValue({
			ok: true,
			data: { sameProduct: true }
		});

		await expect(confirmSameProductMerge('key', 'Arla Mjölk', 'Mjölk 1L')).resolves.toBe(true);
	});

	it('returns null on OpenAI failure', async () => {
		const { requestStructuredJson } = await import('./openai');
		vi.mocked(requestStructuredJson).mockResolvedValue({
			ok: false,
			status: 502,
			messageKey: 'errors.api.openAiRequestFailed'
		});

		await expect(confirmSameProductMerge('key', 'A', 'B')).resolves.toBeNull();
	});

	it('includes expiresOnSource context in user prompt', async () => {
		const { requestStructuredJson } = await import('./openai');
		vi.mocked(requestStructuredJson).mockResolvedValue({
			ok: true,
			data: { sameProduct: true }
		});

		await confirmSameProductMerge('key', 'Arla Mjölk', 'Mjölk 1L', {
			categoryHint: 'mejeri',
			expiresOnSource: 'ai_inferred',
			candidateExpiresOnSource: 'household_learned'
		});

		expect(vi.mocked(requestStructuredJson).mock.calls[0]?.[1].userPrompt).toContain(
			'Hållbarhetskälla (ny rad): ai_inferred'
		);
	});
});
