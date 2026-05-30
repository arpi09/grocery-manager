import { describe, expect, it } from 'vitest';
import { parseReceiptLines, RECEIPT_LINES_SCHEMA } from './receipt-parse';

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
});
