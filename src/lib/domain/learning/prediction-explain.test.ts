import { describe, expect, it } from 'vitest';
import {
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
