import { describe, expect, it } from 'vitest';
import { resolveOffProductName } from './off-product-name';

describe('resolveOffProductName', () => {
	it('prefers Swedish fields for sv locale', () => {
		expect(
			resolveOffProductName(
				{
					product_name_sv: 'Mellanmjölk',
					product_name_en: 'Semi-skimmed milk',
					product_name: 'Semi-skimmed milk'
				},
				'7310865001864',
				'sv'
			)
		).toBe('Mellanmjölk');
	});

	it('falls back to generic Swedish name', () => {
		expect(
			resolveOffProductName(
				{
					generic_name_sv: 'Naturell yoghurt',
					product_name_en: 'Natural yoghurt'
				},
				'7310865001864',
				'sv'
			)
		).toBe('Naturell yoghurt');
	});

	it('prefers English fields for en locale', () => {
		expect(
			resolveOffProductName(
				{
					product_name_sv: 'Mellanmjölk',
					product_name_en: 'Semi-skimmed milk'
				},
				'7310865001864',
				'en'
			)
		).toBe('Semi-skimmed milk');
	});

	it('uses barcode fallback when no names exist', () => {
		expect(resolveOffProductName({}, '7310865001864', 'sv')).toBe('Product 7310865001864');
	});
});
