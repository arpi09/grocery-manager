import { describe, expect, it } from 'vitest';
import {
	dedupeMissingIngredients,
	formatAddMissingFeedback,
	presentAddMissingFeedback,
	type AddMissingApiResult
} from './recipe-add-missing';

describe('dedupeMissingIngredients', () => {
	it('merges lists and dedupes case-insensitively', () => {
		expect(
			dedupeMissingIngredients([
				['Basilika', 'Olivolja'],
				['basilika', ' Citron ']
			])
		).toEqual(['Basilika', 'Olivolja', 'Citron']);
	});

	it('caps at 24 unique ingredients', () => {
		const lists = [Array.from({ length: 30 }, (_, index) => `Ingrediens ${index + 1}`)];
		expect(dedupeMissingIngredients(lists)).toHaveLength(24);
	});
});

describe('formatAddMissingFeedback', () => {
	it('formats success with count', () => {
		const result: AddMissingApiResult = { ok: true, added: 3, skipped: 0 };
		expect(formatAddMissingFeedback('sv', result)).toContain('3');
	});

	it('formats partial and none states', () => {
		expect(
			formatAddMissingFeedback('sv', { ok: true, added: 1, skipped: 2 })
		).toContain('1');
		expect(formatAddMissingFeedback('en', { ok: true, added: 0, skipped: 2 })).toMatch(
			/already/i
		);
	});

	it('falls back to failed message', () => {
		expect(formatAddMissingFeedback('sv', { ok: false, added: 0, skipped: 0 })).toContain(
			'Kunde inte'
		);
	});
});

describe('presentAddMissingFeedback', () => {
	it('returns success tone when items were added', () => {
		const presented = presentAddMissingFeedback('sv', { ok: true, added: 2, skipped: 0 });
		expect(presented.tone).toBe('success');
		expect(presented.message).toContain('2');
	});

	it('returns warning tone when everything was already on the list', () => {
		const presented = presentAddMissingFeedback('en', { ok: true, added: 0, skipped: 3 });
		expect(presented.tone).toBe('warning');
		expect(presented.showListLink).toBe(false);
	});

	it('offers list link after successful add', () => {
		const presented = presentAddMissingFeedback('sv', { ok: true, added: 2, skipped: 0 });
		expect(presented.showListLink).toBe(true);
	});
});
