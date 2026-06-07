import { describe, expect, it } from 'vitest';
import { listRealReceiptPdfs } from '../../e2e/helpers/receipt-fixtures';

describe('listRealReceiptPdfs', () => {
	it('returns only manifest-style real PDFs, not synthetic CI fixtures', () => {
		const pdfs = listRealReceiptPdfs();
		for (const name of pdfs) {
			expect(name).toMatch(/^(ica|kivra|willys)-\d+\.pdf$/i);
			expect(name.startsWith('synthetic-')).toBe(false);
		}
	});
});
