import { describe, expect, it } from 'vitest';
import { guessStorageLocation } from '$lib/domain/guess-storage-location';
import {
	isOpenAiSchemaFailure,
	normalizeReceiptAiPayload,
	parseReceiptLines,
	preprocessReceiptText,
	receiptLineToInventoryAmount,
	RECEIPT_LINES_SCHEMA
} from './receipt-parse';

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

describe('RECEIPT_LINES_SCHEMA', () => {
	it('lists every property as required for OpenAI strict json_schema', () => {
		assertStrictOpenAiSchema(RECEIPT_LINES_SCHEMA);
	});
});

describe('preprocessReceiptText', () => {
	it('strips totals, payment and common non-food rows', () => {
		const raw =
			'ICA Supermarket MJOLK 1L 15.90 DISKMEDEL 750ML 24.90 TOTALT 549.08 SEK BETALAT KORT 549.08';
		expect(preprocessReceiptText(raw)).toBe('ICA Supermarket MJOLK 1L 15.90');
	});

	it('removes moms and rabatt noise', () => {
		const raw = 'BROD FIL 25.00 RABATT STAMMIS -15.00 MOMS 12% 42.18 SUMMA 128.30';
		expect(preprocessReceiptText(raw)).toBe('BROD FIL 25.00');
	});
});

describe('parseReceiptLines', () => {
	it('parses structured line objects', () => {
		expect(
			parseReceiptLines({
				lines: [
					{ name: '  Mjölk  ', quantity: ' 2 ' },
					{ name: 'Bröd' }
				]
			})
		).toEqual([
			{ name: 'Mjölk', quantity: '2', location: 'fridge' },
			{ name: 'Bröd', location: 'cupboard' }
		]);
	});

	it('skips invalid rows', () => {
		expect(parseReceiptLines({ lines: [{ name: '   ' }, { quantity: '1' }] })).toEqual([]);
	});

	it('uses AI location when valid', () => {
		expect(
			parseReceiptLines({
				lines: [{ name: 'Pasta Bolognese', quantity: '1', unit: '', location: 'fridge' }]
			})
		).toEqual([{ name: 'Pasta Bolognese', quantity: '1', location: 'fridge' }]);
	});

	it('falls back to heuristic when location missing or invalid', () => {
		expect(parseReceiptLines({ lines: [{ name: 'Pasta Bolognese', quantity: '1', unit: '' }] })).toEqual([
			{ name: 'Pasta Bolognese', quantity: '1', location: 'fridge' }
		]);
		expect(parseReceiptLines({ lines: [{ name: 'Basmatiris', quantity: '1', unit: 'kg' }] })).toEqual([
			{ name: 'Basmatiris', quantity: '1', unit: 'kg', location: 'cupboard' }
		]);
		expect(parseReceiptLines({ lines: [{ name: 'Frysta ärtor', quantity: '1', unit: 'kg' }] })).toEqual([
			{ name: 'Frysta ärtor', quantity: '1', unit: 'kg', location: 'freezer' }
		]);
		expect(
			parseReceiptLines({
				lines: [{ name: 'Ris', quantity: '1', unit: 'kg', location: 'not-a-place' }]
			})
		).toEqual([{ name: 'Ris', quantity: '1', unit: 'kg', location: 'cupboard' }]);
	});

	it('drops empty quantity strings from strict model output', () => {
		expect(parseReceiptLines({ lines: [{ name: ' Ägg ', quantity: '' }] })).toEqual([
			{ name: 'Ägg', location: 'fridge' }
		]);
	});

	it('coerces numeric quantity to string', () => {
		expect(parseReceiptLines({ lines: [{ name: 'Mjölk', quantity: 2 }] })).toEqual([
			{ name: 'Mjölk', quantity: '2', location: 'fridge' }
		]);
	});

	it('coerces numeric name to string', () => {
		expect(parseReceiptLines({ lines: [{ name: 123, quantity: '1' }] })).toEqual([
			{ name: '123', quantity: '1', location: 'cupboard' }
		]);
	});

	it('ignores extra fields from model output', () => {
		expect(
			parseReceiptLines({
				lines: [{ name: 'Bröd', quantity: '1', price: 29.9, sku: 'abc' }]
			})
		).toEqual([{ name: 'Bröd', quantity: '1', location: 'cupboard' }]);
	});

	it('parses ICA-style package size into quantity and unit', () => {
		expect(
			parseReceiptLines({
				lines: [{ name: 'Coca-Cola', quantity: '1.5', unit: 'l' }]
			})
		).toEqual([{ name: 'Coca-Cola', quantity: '1.5', unit: 'l', location: 'cupboard' }]);
	});

	it('normalizes comma decimals and unit casing', () => {
		expect(
			parseReceiptLines({
				lines: [{ name: 'Cola', quantity: '1,5', unit: ' L ' }]
			})
		).toEqual([{ name: 'Cola', quantity: '1.5', unit: 'l', location: 'cupboard' }]);
	});

	it('drops empty unit from output', () => {
		expect(parseReceiptLines({ lines: [{ name: 'Ägg', quantity: '12', unit: '' }] })).toEqual([
			{ name: 'Ägg', quantity: '12', location: 'fridge' }
		]);
	});
});

describe('receiptLineToInventoryAmount', () => {
	it('defaults missing fields to quantity 1', () => {
		expect(receiptLineToInventoryAmount({ name: 'Bröd', location: 'cupboard' })).toEqual({
			quantity: '1',
			unit: null
		});
	});

	it('maps Cola package size to inventory', () => {
		expect(
			receiptLineToInventoryAmount({ name: 'Coca-Cola', quantity: '1.5', unit: 'l', location: 'cupboard' })
		).toEqual({ quantity: '1.5', unit: 'l' });
	});

	it('splits combined quantity strings from AI receipt lines', () => {
		expect(
			receiptLineToInventoryAmount({ name: 'Mjölk', quantity: '1 st', location: 'fridge' })
		).toEqual({ quantity: '1', unit: 'st' });
		expect(
			receiptLineToInventoryAmount({ name: 'Kött', quantity: '0.71 kg', location: 'fridge' })
		).toEqual({ quantity: '0.71', unit: 'kg' });
		expect(
			receiptLineToInventoryAmount({ name: 'Ägg', quantity: '1 1', location: 'fridge' })
		).toEqual({ quantity: '1', unit: '1' });
	});
});

describe('normalizeReceiptAiPayload', () => {
	it('coerces line field types', () => {
		expect(
			normalizeReceiptAiPayload({
				lines: [{ name: '  Ost ', quantity: 3, extra: true }]
			})
		).toEqual({
			lines: [
				{
					name: 'Ost',
					quantity: '3',
					unit: '',
					location: '',
					unitPrice: null,
					lineTotal: null,
					currency: null,
					brand: null,
					packageSize: null,
					categoryHint: null
				}
			]
		});
	});
});

describe('guessStorageLocation (receipt heuristic)', () => {
	it('matches receipt-parse fallback expectations', () => {
		expect(guessStorageLocation('Pasta Bolognese')).toBe('fridge');
		expect(guessStorageLocation('Basmatiris')).toBe('cupboard');
		expect(guessStorageLocation('Frysta ärtor')).toBe('freezer');
	});
});

describe('isOpenAiSchemaFailure', () => {
	it('detects schema-related OpenAI errors', () => {
		expect(
			isOpenAiSchemaFailure({
				ok: false,
				status: 422,
				messageKey: 'errors.api.openAiInvalidJson'
			})
		).toBe(true);
		expect(
			isOpenAiSchemaFailure({
				ok: false,
				status: 502,
				messageKey: 'errors.api.openAiRequestFailed',
				logDetail: 'Invalid json_schema for response'
			})
		).toBe(true);
		expect(
			isOpenAiSchemaFailure({
				ok: false,
				status: 503,
				messageKey: 'errors.api.openAiRateLimit',
				logDetail: 'OpenAI rate limit reached'
			})
		).toBe(false);
	});
});
