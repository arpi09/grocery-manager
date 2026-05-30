import type { ReceiptLine } from '$lib/domain/receipt-line';
import {
	requestStructuredJson,
	requestStructuredJsonFromImage
} from '$lib/server/openai';

export const RECEIPT_LINES_SCHEMA = {
	type: 'object',
	properties: {
		lines: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					quantity: { type: 'string' }
				},
				required: ['name', 'quantity'],
				additionalProperties: false
			}
		}
	},
	required: ['lines'],
	additionalProperties: false
} as const;

export const RECEIPT_SYSTEM_PROMPT = [
	'Du läser svenska butikskvitton och extraherar livsmedelsrader.',
	'Returnera JSON: {"lines":[{"name":"","quantity":""}]}',
	'Regler:',
	'- name: kort svenskt produktnamn (ingen rabatt/MOMS/total/kortrad)',
	'- quantity: mängd som sträng (t.ex. "2" eller "1.5 kg"), tom sträng om oklart',
	'- hoppa över icke-mat, pant, erbjudanden och butiksinfo',
	'- max 40 rader'
].join('\n');

export function parseReceiptLines(raw: unknown): ReceiptLine[] {
	if (!raw || typeof raw !== 'object' || !('lines' in raw)) {
		return [];
	}

	const lines = (raw as { lines: unknown }).lines;
	if (!Array.isArray(lines)) {
		return [];
	}

	const result: ReceiptLine[] = [];
	for (const entry of lines) {
		if (!entry || typeof entry !== 'object') continue;
		const row = entry as Record<string, unknown>;
		const name = typeof row.name === 'string' ? row.name.trim() : '';
		const quantity =
			typeof row.quantity === 'string' && row.quantity.trim() ? row.quantity.trim() : undefined;
		if (!name) continue;
		result.push(quantity ? { name, quantity } : { name });
	}

	return result;
}

export async function parseReceiptFromImage(apiKey: string, imageDataUrl: string) {
	return requestStructuredJsonFromImage(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: 'Lista matvaror från detta kvitto.',
		imageDataUrl,
		schemaName: 'receipt_lines',
		schema: RECEIPT_LINES_SCHEMA
	});
}

export async function parseReceiptFromText(apiKey: string, receiptText: string) {
	return requestStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: [
			'Lista matvaror från detta kvitto.',
			'Kvittoinnehåll:',
			receiptText.slice(0, 12_000)
		].join('\n\n'),
		schemaName: 'receipt_lines',
		schema: RECEIPT_LINES_SCHEMA
	});
}
