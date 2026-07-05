import { describe, expect, it } from 'vitest';
import { parseSundayAddRows } from './sunday-add';

function json(value: unknown): string {
	return JSON.stringify(value);
}

describe('parseSundayAddRows', () => {
	it('parses valid replenishment and AI rows', () => {
		const rows = parseSundayAddRows(
			json([
				{ source: 'replenishment', name: 'Mjölk', quantity: '1 L', normalizedKey: 'mjolk' },
				{ source: 'ai', name: 'Tacokrydda', quantity: '1 st', relatedMealDate: '2026-07-10' }
			])
		);
		expect(rows).toEqual([
			{
				source: 'replenishment',
				name: 'Mjölk',
				quantity: '1 L',
				normalizedKey: 'mjolk',
				relatedMealDate: null,
				relatedRecipeTitle: null
			},
			{
				source: 'ai',
				name: 'Tacokrydda',
				quantity: '1 st',
				normalizedKey: null,
				relatedMealDate: '2026-07-10',
				relatedRecipeTitle: null
			}
		]);
	});

	it('drops the normalizedKey on AI rows so they never trigger a learning accept', () => {
		const rows = parseSundayAddRows(
			json([{ source: 'ai', name: 'Lök', quantity: '', normalizedKey: 'lok' }])
		);
		expect(rows?.[0].normalizedKey).toBeNull();
	});

	it('skips malformed entries but keeps valid ones', () => {
		const rows = parseSundayAddRows(
			json([
				{ source: 'nope', name: 'X' },
				{ source: 'ai', name: '   ' },
				null,
				42,
				{ source: 'ai', name: 'Ägg', quantity: '6 st' }
			])
		);
		expect(rows).toHaveLength(1);
		expect(rows?.[0].name).toBe('Ägg');
	});

	it('returns null for non-array, non-json, empty, and all-invalid input', () => {
		expect(parseSundayAddRows(null)).toBeNull();
		expect(parseSundayAddRows('')).toBeNull();
		expect(parseSundayAddRows('not json')).toBeNull();
		expect(parseSundayAddRows(json({ source: 'ai', name: 'X' }))).toBeNull();
		expect(parseSundayAddRows(json([]))).toBeNull();
		expect(parseSundayAddRows(json([{ source: 'ai', name: '' }]))).toBeNull();
	});

	it('caps at the panel maximum', () => {
		const many = Array.from({ length: 25 }, (_, i) => ({
			source: 'ai',
			name: `Item ${i}`,
			quantity: '1 st'
		}));
		expect(parseSundayAddRows(json(many))).toHaveLength(10);
	});
});
