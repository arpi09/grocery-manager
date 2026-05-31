import { describe, expect, it } from 'vitest';
import {
	isOpenAiSchemaFailure,
	normalizeReceiptAiPayload,
	parseReceiptLines,
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
			{ name: 'Mjölk', quantity: '2' },
			{ name: 'Bröd' }
		]);
	});

	it('skips invalid rows', () => {
		expect(parseReceiptLines({ lines: [{ name: '   ' }, { quantity: '1' }] })).toEqual([]);
	});

	it('drops empty quantity strings from strict model output', () => {
		expect(parseReceiptLines({ lines: [{ name: ' Ägg ', quantity: '' }] })).toEqual([{ name: 'Ägg' }]);
	});

	it('coerces numeric quantity to string', () => {
		expect(parseReceiptLines({ lines: [{ name: 'Mjölk', quantity: 2 }] })).toEqual([
			{ name: 'Mjölk', quantity: '2' }
		]);
	});

	it('coerces numeric name to string', () => {
		expect(parseReceiptLines({ lines: [{ name: 123, quantity: '1' }] })).toEqual([
			{ name: '123', quantity: '1' }
		]);
	});

	it('ignores extra fields from model output', () => {
		expect(
			parseReceiptLines({
				lines: [{ name: 'Bröd', quantity: '1', price: 29.9, sku: 'abc' }]
			})
		).toEqual([{ name: 'Bröd', quantity: '1' }]);
	});
});

describe('normalizeReceiptAiPayload', () => {
	it('coerces line field types', () => {
		expect(
			normalizeReceiptAiPayload({
				lines: [{ name: '  Ost ', quantity: 3, extra: true }]
			})
		).toEqual({
			lines: [{ name: 'Ost', quantity: '3' }]
		});
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
