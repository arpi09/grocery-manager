import type { ReceiptLine } from '$lib/domain/receipt-line';
import {
	openAiErrorLogDetail,
	OPENAI_EMPTY_RESPONSE_KEY,
	OPENAI_INVALID_JSON_KEY,
	requestStructuredJson,
	requestStructuredJsonFromImage,
	type OpenAiFailureResult
} from '$lib/server/openai';
import type { MessageKey } from '$lib/i18n/messages';

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

function coerceReceiptName(value: unknown): string {
	if (typeof value === 'string') {
		return value.trim();
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return '';
}

function coerceReceiptQuantity(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return undefined;
}

/** Normalizes model output before line parsing (coerce types, ignore extra fields). */
export function normalizeReceiptAiPayload(raw: unknown): unknown {
	if (!raw || typeof raw !== 'object' || !('lines' in raw)) {
		return raw;
	}

	const lines = (raw as { lines: unknown }).lines;
	if (!Array.isArray(lines)) {
		return raw;
	}

	return {
		lines: lines.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return entry;
			}
			const row = entry as Record<string, unknown>;
			const normalized: Record<string, unknown> = {
				name: coerceReceiptName(row.name)
			};
			const quantity = coerceReceiptQuantity(row.quantity);
			if (quantity) {
				normalized.quantity = quantity;
			} else {
				normalized.quantity = '';
			}
			return normalized;
		})
	};
}

export function parseReceiptLines(raw: unknown): ReceiptLine[] {
	const normalized = normalizeReceiptAiPayload(raw);
	if (!normalized || typeof normalized !== 'object' || !('lines' in normalized)) {
		return [];
	}

	const lines = (normalized as { lines: unknown }).lines;
	if (!Array.isArray(lines)) {
		return [];
	}

	const result: ReceiptLine[] = [];
	for (const entry of lines) {
		if (!entry || typeof entry !== 'object') continue;
		const row = entry as Record<string, unknown>;
		const name = coerceReceiptName(row.name);
		const quantity = coerceReceiptQuantity(row.quantity);
		if (!name) continue;
		result.push(quantity ? { name, quantity } : { name });
	}

	return result;
}

const SCHEMA_RETRY_KEYS = new Set<MessageKey>([OPENAI_INVALID_JSON_KEY, OPENAI_EMPTY_RESPONSE_KEY]);

export function isOpenAiSchemaFailure(result: OpenAiFailureResult): boolean {
	if (SCHEMA_RETRY_KEYS.has(result.messageKey)) {
		return true;
	}
	const detail = (openAiErrorLogDetail(result) ?? '').toLowerCase();
	return (
		detail.includes('json_schema') ||
		detail.includes('json schema') ||
		detail.includes('schema') ||
		detail.includes('invalid json')
	);
}

type ReceiptStructuredOptions = {
	systemPrompt: string;
	userPrompt: string;
	imageDataUrl?: string;
};

async function requestReceiptStructuredJson(
	apiKey: string,
	options: ReceiptStructuredOptions
): Promise<Awaited<ReturnType<typeof requestStructuredJson>>> {
	const base = {
		systemPrompt: options.systemPrompt,
		userPrompt: options.userPrompt,
		schemaName: 'receipt_lines',
		schema: RECEIPT_LINES_SCHEMA
	};

	const strictResult = options.imageDataUrl
		? await requestStructuredJsonFromImage(apiKey, { ...base, imageDataUrl: options.imageDataUrl })
		: await requestStructuredJson(apiKey, base);

	if (strictResult.ok || !isOpenAiSchemaFailure(strictResult)) {
		return strictResult;
	}

	console.warn(
		'[receipt] Strict JSON schema failed; retrying with non-strict mode:',
		openAiErrorLogDetail(strictResult).slice(0, 300)
	);

	return options.imageDataUrl
		? await requestStructuredJsonFromImage(apiKey, {
				...base,
				imageDataUrl: options.imageDataUrl,
				strict: false
			})
		: await requestStructuredJson(apiKey, { ...base, strict: false });
}

export async function parseReceiptFromImage(apiKey: string, imageDataUrl: string) {
	return requestReceiptStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: 'Lista matvaror från detta kvitto.',
		imageDataUrl
	});
}

export async function parseReceiptFromText(apiKey: string, receiptText: string) {
	return requestReceiptStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: [
			'Lista matvaror från detta kvitto.',
			'Kvittoinnehåll:',
			receiptText.slice(0, 12_000)
		].join('\n\n')
	});
}
