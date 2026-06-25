import { describe, expect, it } from 'vitest';
import {
	BRAND_AND_PRODUCT_REASONING_RULES,
	PROMPT_VERSION_RECEIPT_PARSE,
	RECEIPT_CATEGORY_TAXONOMY
} from '$lib/server/ai-prompt-shared';
import { RECEIPT_PARSE_FEW_SHOT_BLOCK } from '$lib/server/receipt-parse-few-shot';
import { RECEIPT_SYSTEM_PROMPT } from '$lib/server/receipt-parse';

describe('receipt parse prompt golden', () => {
	it('uses receipt-parse-v5 with taxonomy and brand reasoning', () => {
		expect(PROMPT_VERSION_RECEIPT_PARSE).toBe('receipt-parse-v5');
		expect(RECEIPT_SYSTEM_PROMPT).toContain(PROMPT_VERSION_RECEIPT_PARSE);
		expect(RECEIPT_SYSTEM_PROMPT).toContain(RECEIPT_CATEGORY_TAXONOMY);
		expect(RECEIPT_SYSTEM_PROMPT).toContain(BRAND_AND_PRODUCT_REASONING_RULES);
		expect(RECEIPT_SYSTEM_PROMPT).toContain('Ben & Jerry');
	});

	it('includes few-shot illustration block', () => {
		expect(RECEIPT_PARSE_FEW_SHOT_BLOCK).toContain('Findus');
		expect(RECEIPT_SYSTEM_PROMPT).toContain(RECEIPT_PARSE_FEW_SHOT_BLOCK);
	});
});
