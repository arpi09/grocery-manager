import { describe, expect, it } from 'vitest';
import {
	normalizePhotoRoundPayload,
	parsePhotoRoundItems,
	PHOTO_ROUND_ITEMS_SCHEMA,
	photoRoundSystemPrompt
} from './photo-round-parse';

function assertStrictOpenAiSchema(schema: Record<string, unknown>, path = '$'): void {
	if (schema.type === 'object') {
		expect(schema.additionalProperties, `${path}.additionalProperties`).toBe(false);

		const properties = schema.properties as Record<string, unknown> | undefined;
		if (properties && typeof properties === 'object') {
			const required = new Set(
				Array.isArray(schema.required) ? schema.required.filter((key) => typeof key === 'string') : []
			);
			for (const key of Object.keys(properties)) {
				expect(required.has(key), `${path}.properties.${key} must be required for strict mode`).toBe(
					true
				);
				const child = properties[key];
				if (child && typeof child === 'object') {
					assertStrictOpenAiSchema(child as Record<string, unknown>, `${path}.properties.${key}`);
				}
			}
		}
	}

	const items = schema.items;
	if (items && typeof items === 'object' && !Array.isArray(items)) {
		assertStrictOpenAiSchema(items as Record<string, unknown>, `${path}.items`);
	}
}

describe('PHOTO_ROUND_ITEMS_SCHEMA', () => {
	it('lists every property as required for OpenAI strict json_schema', () => {
		assertStrictOpenAiSchema(PHOTO_ROUND_ITEMS_SCHEMA);
	});
});

describe('photoRoundSystemPrompt', () => {
	it('mentions anti-hallucination and zone context', () => {
		const prompt = photoRoundSystemPrompt('fridge');
		expect(prompt).toContain('ENDAST');
		expect(prompt).toContain('kyl');
	});
});

describe('parsePhotoRoundItems', () => {
	it('parses structured items with zone location', () => {
		expect(
			parsePhotoRoundItems(
				{
					items: [
						{ name: '  Mjölk  ', quantity: '2', unit: 'l', confidence: 'high' },
						{ name: 'Bröd', quantity: '1', unit: '', confidence: 'medium' }
					]
				},
				'fridge'
			)
		).toEqual([
			{
				name: 'Mjölk',
				quantity: '2',
				unit: 'l',
				confidence: 'high',
				location: 'fridge'
			},
			{
				name: 'Bröd',
				quantity: '1',
				unit: null,
				confidence: 'medium',
				location: 'fridge'
			}
		]);
	});

	it('dedupes by normalized name', () => {
		expect(
			parsePhotoRoundItems(
				{
					items: [
						{ name: 'Mjölk', quantity: '1', unit: '', confidence: 'high' },
						{ name: 'mjölk', quantity: '2', unit: '', confidence: 'low' }
					]
				},
				'cupboard'
			)
		).toHaveLength(1);
	});

	it('skips invalid rows', () => {
		expect(parsePhotoRoundItems({ items: [{ name: '   ' }, { quantity: '1' }] }, 'freezer')).toEqual(
			[]
		);
	});
});

describe('normalizePhotoRoundPayload', () => {
	it('coerces quantity and confidence defaults', () => {
		expect(
			normalizePhotoRoundPayload({
				items: [{ name: 'Ägg', quantity: '', unit: null, confidence: 'nope' }]
			})
		).toEqual({
			items: [{ name: 'Ägg', quantity: '1', unit: '', confidence: 'low' }]
		});
	});
});
