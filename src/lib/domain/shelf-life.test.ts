import { describe, expect, it } from 'vitest';
import { guessShelfLife } from './shelf-life';

describe('guessShelfLife', () => {
	it('guesses short shelf life for dairy', () => {
		const result = guessShelfLife('Mjölk 3%', 'fridge');
		expect(result).not.toBeNull();
		expect(result?.source).toBe('heuristic');
		expect(result?.expiresOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('extends shelf life in freezer', () => {
		const fridge = guessShelfLife('Kycklingfilé', 'fridge');
		const freezer = guessShelfLife('Kycklingfilé', 'freezer');
		expect(fridge).not.toBeNull();
		expect(freezer).not.toBeNull();
		expect(freezer!.expiresOn > fridge!.expiresOn).toBe(true);
	});

	it('guesses long shelf life for dry goods', () => {
		const result = guessShelfLife('Basmatiris 1kg', 'cupboard');
		expect(result).not.toBeNull();
		const daysAhead = Math.round(
			(new Date(result!.expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		);
		expect(daysAhead).toBeGreaterThan(300);
	});

	it('returns null for unknown products', () => {
		expect(guessShelfLife('Xyzzq unknown product', 'cupboard')).toBeNull();
	});
});
