import { describe, expect, it } from 'vitest';
import {
	coerceExpiresOn,
	normalizePhotoRoundPayload,
	parsePhotoRoundItems,
	parsePhotoRoundResponse,
	parsePhotoRoundZoneHint,
	PHOTO_ROUND_ITEMS_SCHEMA,
	PHOTO_ROUND_VALIDATION_PROMPT,
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

	it('includes expiresOn and notes on each item', () => {
		const itemSchema = PHOTO_ROUND_ITEMS_SCHEMA.properties.items.items as unknown as {
			required: readonly string[];
		};
		expect(itemSchema.required).toContain('expiresOn');
		expect(itemSchema.required).toContain('notes');
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

	it('includes unit volume and expiry rules', () => {
		const prompt = photoRoundSystemPrompt('fridge');
		expect(prompt).toContain('netto');
		expect(prompt).toContain('expiresOn');
		expect(prompt).toContain('INTE st');
	});
});

describe('PHOTO_ROUND_VALIDATION_PROMPT', () => {
	it('tells model not to add new items', () => {
		expect(PHOTO_ROUND_VALIDATION_PROMPT).toContain('Lägg INTE till');
	});
});

describe('coerceExpiresOn', () => {
	it('accepts valid YYYY-MM-DD dates', () => {
		expect(coerceExpiresOn('2026-06-15')).toBe('2026-06-15');
	});

	it('rejects invalid dates and formats', () => {
		expect(coerceExpiresOn('15/06/2026')).toBeNull();
		expect(coerceExpiresOn('2026-02-30')).toBeNull();
		expect(coerceExpiresOn('')).toBeNull();
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
	it('parses structured items with per-item location, expiry and notes', () => {
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
							location: 'fridge',
							expiresOn: '2026-06-15',
							notes: 'Arla 3%'
						},
						{
							name: 'Pasta',
							quantity: '1',
							unit: '',
							confidence: 'medium',
							location: 'cupboard',
							expiresOn: '',
							notes: ''
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
				location: 'fridge',
				expiresOn: '2026-06-15',
				notes: 'Arla 3%'
			},
			{
				name: 'Pasta',
				quantity: '1',
				unit: 'g',
				confidence: 'medium',
				location: 'cupboard',
				expiresOn: null,
				notes: null
			}
		]);
	});

	it('suggests unit from name when model returns st for liquids', () => {
		expect(
			parsePhotoRoundItems(
				{
					detectedZone: 'fridge',
					zoneConfidence: 'high',
					items: [
						{
							name: 'Mjölk',
							quantity: '1',
							unit: 'st',
							confidence: 'high',
							location: 'fridge',
							expiresOn: '',
							notes: ''
						}
					]
				},
				'fridge'
			)
		).toEqual([
			expect.objectContaining({
				name: 'Mjölk',
				unit: 'l'
			})
		]);
	});

	it('parses gram from combined quantity hint in unit field', () => {
		expect(
			parsePhotoRoundItems(
				{
					detectedZone: 'cupboard',
					zoneConfidence: 'high',
					items: [
						{
							name: 'Pasta penne',
							quantity: '500',
							unit: 'g',
							confidence: 'high',
							location: 'cupboard',
							expiresOn: '',
							notes: ''
						}
					]
				},
				'cupboard'
			)
		).toEqual([
			expect.objectContaining({
				name: 'Pasta penne',
				quantity: '500',
				unit: 'g'
			})
		]);
	});

	it('uses zone hint when item location missing', () => {
		expect(
			parsePhotoRoundItems(
				{
					detectedZone: 'cupboard',
					zoneConfidence: 'high',
					items: [
						{
							name: 'Bröd',
							quantity: '1',
							unit: '',
							confidence: 'medium',
							location: '',
							expiresOn: '',
							notes: ''
						}
					]
				},
				'fridge'
			)
		).toEqual([
			{
				name: 'Bröd',
				quantity: '1',
				unit: 'st',
				confidence: 'medium',
				location: 'fridge',
				expiresOn: null,
				notes: null
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
							location: 'fridge',
							expiresOn: '',
							notes: ''
						},
						{
							name: 'mjölk',
							quantity: '2',
							unit: '',
							confidence: 'low',
							location: 'fridge',
							expiresOn: '',
							notes: ''
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
							location: 'fridge',
							expiresOn: '2026-06-01',
							notes: ''
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
					location: 'fridge',
					expiresOn: '2026-06-01',
					notes: null
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
				items: [
					{
						name: 'Ägg',
						quantity: '',
						unit: null,
						confidence: 'nope',
						location: 'fridge',
						expiresOn: 'bad',
						notes: '  '
					}
				]
			})
		).toEqual({
			detectedZone: 'fridge',
			items: [
				{
					name: 'Ägg',
					quantity: '1',
					unit: 'st',
					confidence: 'low',
					location: 'fridge',
					expiresOn: '',
					notes: ''
				}
			]
		});
	});
});
