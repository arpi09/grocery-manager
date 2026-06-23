import { describe, expect, it, vi } from 'vitest';
import { confirmSameProductMerge } from './inventory-merge-ai';

vi.mock('./openai', () => ({
	OPENAI_MODEL_NANO: 'gpt-4.1-nano',
	requestStructuredJson: vi.fn()
}));

describe('confirmSameProductMerge', () => {
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
});
