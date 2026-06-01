import { describe, expect, it } from 'vitest';
import { parseReceiptLines } from './receipt-parse';

/** Realistic mock AI output shaped like synthetic ICA/Willys/Kivra fixtures (no OpenAI). */
const SYNTHETIC_RECEIPT_CASES = [
	{
		name: 'synthetic-ica-01',
		lines: [
			{ name: 'Mjölk', quantity: '1', unit: 'l', location: 'fridge' },
			{ name: 'Bröd', quantity: '1', unit: '', location: 'cupboard' },
			{ name: 'Yoghurt naturell', quantity: '1', unit: '', location: 'fridge' },
			{ name: 'Ost Gudbrandsdal', quantity: '1', unit: '', location: 'fridge' },
			{ name: 'Äpplen', quantity: '1', unit: 'kg', location: 'fridge' }
		]
	},
	{
		name: 'synthetic-willys-01',
		lines: [
			{ name: 'Pasta spaghetti', quantity: '1', unit: '', location: 'cupboard' },
			{ name: 'Krossade tomater', quantity: '1', unit: '', location: 'cupboard' },
			{ name: 'Kycklingfilé', quantity: '1', unit: '', location: 'fridge' },
			{ name: 'Bananer', quantity: '1', unit: 'kg', location: 'fridge' },
			{ name: 'Smör', quantity: '500', unit: 'g', location: 'fridge' }
		]
	},
	{
		name: 'synthetic-kivra-02',
		lines: [
			{ name: 'Filmjölk 3%', quantity: '1', unit: 'l', location: 'fridge' },
			{ name: 'Fil 12%', quantity: '1', unit: 'l', location: 'fridge' },
			{ name: 'Ägg 12-pack', quantity: '1', unit: 'st', location: 'fridge' },
			{ name: 'Falukorv', quantity: '800', unit: 'g', location: 'fridge' },
			{ name: 'Potatis fast', quantity: '2', unit: 'kg', location: 'fridge' }
		]
	}
] as const;

describe('receipt synthetic fixture regression', () => {
	it.each(SYNTHETIC_RECEIPT_CASES)('$name parses all food lines with storage location', ({ lines }) => {
		const parsed = parseReceiptLines({ lines: [...lines] });
		expect(parsed).toHaveLength(lines.length);
		for (const line of parsed) {
			expect(line.name.length).toBeGreaterThan(0);
			expect(['fridge', 'freezer', 'cupboard']).toContain(line.location);
		}
	});

	it('maps ICA-style ready meal and dry goods from heuristics when location omitted', () => {
		expect(
			parseReceiptLines({
				lines: [
					{ name: 'Pasta penne', quantity: '500', unit: 'g', location: '' },
					{ name: 'Gräddfil 15%', quantity: '500', unit: 'ml', location: '' }
				]
			})
		).toEqual([
			{ name: 'Pasta penne', quantity: '500', unit: 'g', location: 'cupboard' },
			{ name: 'Gräddfil 15%', quantity: '500', unit: 'ml', location: 'fridge' }
		]);
	});
});
