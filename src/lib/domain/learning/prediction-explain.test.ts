import { describe, expect, it } from 'vitest';
import {
	buildInventoryExpiryExplanation,
	buildInventoryShelfLifeExplanation,
	buildLocationExplanationFromSource,
	buildShelfLifeExplanationFromSource,
	renderExplanationContent
} from '$lib/domain/learning/prediction-explain';

describe('buildShelfLifeExplanationFromSource', () => {
	it('builds household primary with sample count and purchase facts', () => {
		const explanation = buildShelfLifeExplanationFromSource('sv', {
			source: 'household_learned',
			typicalDays: 6,
			location: 'fridge',
			sampleCount: 5,
			purchasedAt: '2026-06-10',
			displayName: 'Mjölk',
			normalizedKey: 'mjolk'
		});

		expect(explanation?.templateId).toBe('shelf_life.household');
		expect(explanation?.primary).toContain('6');
		expect(explanation?.facts.some((fact) => fact.includes('5'))).toBe(true);
		expect(explanation?.facts.some((fact) => fact.includes('2026-06-10'))).toBe(true);
	});

	it('builds heuristic explanation with location fact', () => {
		const explanation = buildShelfLifeExplanationFromSource('sv', {
			source: 'heuristic',
			location: 'fridge',
			normalizedKey: 'mjolk'
		});

		expect(explanation?.templateId).toBe('shelf_life.heuristic');
		expect(explanation?.facts[0]).toMatch(/kyl/i);
	});

	it('returns null for user_set source', () => {
		expect(
			buildShelfLifeExplanationFromSource('sv', {
				source: 'user_set',
				normalizedKey: 'mjolk'
			})
		).toBeNull();
	});
});

describe('buildLocationExplanationFromSource', () => {
	it('builds household location explanation', () => {
		const explanation = buildLocationExplanationFromSource('sv', {
			source: 'household_rule',
			location: 'fridge',
			productName: 'Kyckling',
			sampleCount: 3,
			normalizedKey: 'kyckling'
		});

		expect(explanation?.primary).toContain('Kyckling');
		expect(explanation?.facts[0]).toContain('3');
	});
});

describe('buildInventoryShelfLifeExplanation', () => {
	it('derives normalized key from product name', () => {
		const explanation = buildInventoryShelfLifeExplanation({
			source: 'heuristic',
			productName: 'Mjölk',
			location: 'fridge'
		});

		expect(explanation?.templateId).toBe('shelf_life.heuristic');
	});
});

describe('buildInventoryExpiryExplanation', () => {
	it('builds an honest household explanation without fabricating a day count', () => {
		const explanation = buildInventoryExpiryExplanation(
			{ source: 'household_learned', location: 'fridge' },
			'sv'
		);

		expect(explanation?.templateId).toBe('pantry_expiry.household_learned');
		expect(explanation?.primary).not.toMatch(/\d/);
		expect(explanation?.facts[0]).toMatch(/kyl/i);
	});

	it('labels an AI estimate distinctly from a heuristic one', () => {
		const ai = buildInventoryExpiryExplanation({ source: 'ai_inferred' }, 'sv');
		const heuristic = buildInventoryExpiryExplanation({ source: 'heuristic' }, 'sv');

		expect(ai?.templateId).toBe('pantry_expiry.ai_inferred');
		expect(heuristic?.templateId).toBe('pantry_expiry.heuristic');
		expect(ai?.primary).not.toBe(heuristic?.primary);
	});

	it('omits the location fact when no location is known', () => {
		const explanation = buildInventoryExpiryExplanation({ source: 'default_heuristic' }, 'sv');
		expect(explanation?.facts).toEqual([]);
	});

	it('returns null for non-estimated sources', () => {
		expect(buildInventoryExpiryExplanation({ source: 'user_set' }, 'sv')).toBeNull();
		expect(buildInventoryExpiryExplanation({ source: 'receipt_printed' }, 'sv')).toBeNull();
		expect(buildInventoryExpiryExplanation({ source: null }, 'sv')).toBeNull();
	});
});

describe('renderExplanationContent', () => {
	it('trims and filters empty facts', () => {
		const rendered = renderExplanationContent({
			primary: '  Primary line  ',
			facts: [' Fact one ', '', 'Fact two'],
			templateId: 'test'
		});

		expect(rendered.primary).toBe('Primary line');
		expect(rendered.facts).toEqual(['Fact one', 'Fact two']);
	});
});
