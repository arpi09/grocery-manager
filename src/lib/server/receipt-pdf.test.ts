import { describe, expect, it, vi } from 'vitest';

vi.mock('pdf-parse', () => ({
	PDFParse: class {
		constructor(_options: unknown) {}

		async getText() {
			return {
				text: '  Mjölk 15kr\nBröd 25kr\nYoghurt 12kr\nOst 45kr\nÄpplen 1kg\n  '
			};
		}

		async destroy() {}
	}
}));

import { extractPdfText } from './receipt-pdf';

describe('extractPdfText', () => {
	it('returns trimmed text when enough content is extracted', async () => {
		const result = await extractPdfText(new Uint8Array([1, 2, 3]));
		expect(result).toEqual({ ok: true, text: 'Mjölk 15kr Bröd 25kr Yoghurt 12kr Ost 45kr Äpplen 1kg' });
	});
});
