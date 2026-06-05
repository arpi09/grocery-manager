import { describe, expect, it } from 'vitest';
import {
	normalizePhotoRoundPayload,
	parsePhotoRoundItems,
	parsePhotoRoundResponse,
	parsePhotoRoundZoneHint,
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
	it('mentions anti-hallucination and zone context with hint', () => {
		const prompt = photoRoundSystemPrompt('fridge');
		expect(prompt).toContain('ENDAST');
		expect(prompt).toContain('kyl');
		expect(prompt).toContain('location');
	});

	it('asks model to detect zone when no hint', () => {
		const prompt = photoRoundSystemPrompt(null);
		expect(prompt).toContain('detectedZone');
		expect(prompt).toContain('Identifiera zonen');
	});
});

describe('parsePhotoRoundZoneHint', () => {
	it('accepts storage locations and auto', () => {
		expect(parsePhotoRoundZoneHint('fridge')).toBe('fridge');
		expect(parsePhotoRoundZoneHint('auto')).toBeNull();
		expect(parsePhotoRoundZoneHint('')).toBeNull();
		expect(parsePhotoRoundZoneHint('pantry')).toBeNull();
	});
});

describe('parsePhotoRoundItems', () => {
	it('parses structured items with per-item location', () => {
		expect(
			parsePhotoRoundItems(
				{
					detectedZone: 'fridge',
					zoneConfidence: 'high',
					items: [
						{
							name: '  Mjölk  ',
							quantity: '2',
							unit: 'l',
							confidence: 'high',
							location: 'fridge'
						},
						{
							name: 'Pasta',
							quantity: '1',
							unit: '',
							confidence: 'medium',
							location: 'cupboard'
						}
					]
				},
				null
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
				name: 'Pasta',
				quantity: '1',
				unit: null,
				confidence: 'medium',
				location: 'cupboard'
			}
		]);
	});

	it('uses zone hint when item location missing', () => {
		expect(
			parsePhotoRoundItems(
				{
					detectedZone: 'cupboard',
					zoneConfidence: 'high',
					items: [{ name: 'Bröd', quantity: '1', unit: '', confidence: 'medium', location: '' }]
				},
				'fridge'
			)
		).toEqual([
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
					detectedZone: 'cupboard',
					zoneConfidence: 'high',
					items: [
						{
							name: 'Mjölk',
							quantity: '1',
							unit: '',
							confidence: 'high',
							location: 'fridge'
						},
						{
							name: 'mjölk',
							quantity: '2',
							unit: '',
							confidence: 'low',
							location: 'fridge'
						}
					]
				},
				'cupboard'
			)
		).toHaveLength(1);
	});

	it('skips invalid rows', () => {
		expect(
			parsePhotoRoundItems(
				{ detectedZone: 'freezer', zoneConfidence: 'low', items: [{ name: '   ' }, { quantity: '1' }] },
				'freezer'
			)
		).toEqual([]);
	});
});

describe('parsePhotoRoundResponse', () => {
	it('forces high zone confidence when hint provided', () => {
		expect(
			parsePhotoRoundResponse(
				{
					detectedZone: 'cupboard',
					zoneConfidence: 'low',
					items: [
						{
							name: 'Mjölk',
							quantity: '1',
							unit: 'l',
							confidence: 'high',
							location: 'fridge'
						}
					]
				},
				'fridge'
			)
		).toEqual({
			detectedZone: 'fridge',
			zoneConfidence: 'high',
			items: [
				{
					name: 'Mjölk',
					quantity: '1',
					unit: 'l',
					confidence: 'high',
					location: 'fridge'
				}
			]
		});
	});
});

describe('normalizePhotoRoundPayload', () => {
	it('coerces quantity and confidence defaults', () => {
		expect(
			normalizePhotoRoundPayload({
				detectedZone: 'fridge',
				zoneConfidence: 'nope',
				items: [{ name: 'Ägg', quantity: '', unit: null, confidence: 'nope', location: 'fridge' }]
			})
		).toEqual({
			detectedZone: 'fridge',
			items: [
				{
					name: 'Ägg',
					quantity: '1',
					unit: '',
					confidence: 'low',
					location: 'fridge'
				}
			]
		});
	});
});
