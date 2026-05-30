import { describe, it, expect } from 'vitest';
import { unknownBarcodeProductName } from './barcode-product';

describe('unknownBarcodeProductName', () => {
	it('uses digits only in the label', () => {
		expect(unknownBarcodeProductName('731-086-2000003', 'sv')).toBe('Okänd vara (7310862000003)');
	});

	it('falls back to raw barcode when no digits', () => {
		expect(unknownBarcodeProductName('ABC', 'sv')).toBe('Okänd vara (ABC)');
	});

	it('handles empty string', () => {
		expect(unknownBarcodeProductName('', 'sv')).toBe('Okänd vara ()');
	});
});
