import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { isStorageLocation } from '$lib/domain/location';
import {
	openAiErrorLogDetail,
	OPENAI_EMPTY_RESPONSE_KEY,
	OPENAI_INVALID_JSON_KEY,
	requestStructuredJson,
	requestStructuredJsonFromImage,
	type OpenAiFailureResult
} from '$lib/server/openai';
import type { MessageKey } from '$lib/i18n/messages';
import { parseSuggestionQuantity } from '$lib/server/shopping-suggestions';

export const RECEIPT_LINES_SCHEMA = {
	type: 'object',
	properties: {
		lines: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					quantity: { type: 'string' },
					unit: { type: 'string' },
					location: { type: 'string', enum: ['fridge', 'freezer', 'cupboard'] },
					unitPrice: { type: ['string', 'null'] },
					lineTotal: { type: ['string', 'null'] },
					currency: { type: ['string', 'null'] }
				},
				required: ['name', 'quantity', 'unit', 'location', 'unitPrice', 'lineTotal', 'currency'],
				additionalProperties: false
			}
		}
	},
	required: ['lines'],
	additionalProperties: false
} as const;

export const RECEIPT_SYSTEM_PROMPT = [
	'Du läser svenska butikskvitton (ICA, Maxi, Kivra, Willys m.fl.) och extraherar livsmedelsrader.',
	'Returnera JSON: {"lines":[{"name":"","quantity":"","unit":"","location":""}]}',
	'Regler:',
	'- name: kort produktnamn utan storlek/vikt (t.ex. "Coca-Cola", inte "Coca-Cola 1,5L")',
	'- quantity: numerisk mängd som sträng med punkt som decimal (t.ex. "1", "1.5", "0.45")',
	'- unitPrice/lineTotal: pris som sträng med punkt som decimal (Svenska kommatecken normaliseras), annars null',
	'- currency: ISO-kod (oftast "SEK"), annars null',
	'  - Synlig förpackning på raden (1,5L, 500 g, 1 kg): sätt quantity till storleken, unit till enheten',
	'  - Flera stycken utan tydlig storlek: antal köpta (t.ex. "2") och unit "st" eller tom',
	'  - Lösvikt: vikten i quantity, unit "kg"',
	'  - En vara utan storlek: quantity "1", unit tom',
	'- unit: l, ml, kg, g, st, pack — tom sträng om okänd',
	'- location: fridge | freezer | cupboard (förvaring hemma)',
	'  - fridge: mejeri, kött, fisk, chark, färdigrätter (t.ex. pasta bolognese), färska grönsaker, ägg, mat som ska kylas',
	'  - freezer: frysta varor, glass, djupfryst',
	'  - cupboard: torrvaror (ris, pasta torr, mjöl), konserver, kryddor, kaffe, te, drycker som inte kräver kyl',
	'- hoppa över icke-mat, pant, erbjudanden och butiksinfo',
	'- max 40 rader'
].join('\n');

/** Receipt footer/header tokens stripped before text-based OpenAI parse. */
const RECEIPT_TEXT_NOISE_PATTERNS = [
	/\b(?:dis(?:k)?medel|toalettpapper|tvättmedel|tvattmedel|servetter|blöjor|blojor)\b[\d\s.,:%mlg-]*/gi,
	/\b(?:total(?:t)?|summa|att\s+betala)\b[\d\s.,:-]*(?:sek|kr)?/gi,
	/\bmoms\s*\d+\s*%[\d\s.,:-]*/gi,
	/\b(?:betalt|betalat|betal(?:as)?)(?:\s+kort)?[\d\s.,:-]*/gi,
	/\brabatt\b[\w\s.-]*?-?\d+[.,]?\d*/gi,
	/\b(?:kvitto\s*\d{4}[-/]\d{2}[-/]\d{2}|org\.?\s*nr|pant\s*\d+|stammis|kort\s*\d+|visa|mastercard|swish|kontant|varav\s+moms|öresutjämning|oresutjamning)\b[\d\s.,:-]*/gi
];

/** Removes totals, payment lines and common non-food rows from extracted PDF text. */
export function preprocessReceiptText(raw: string): string {
	let cleaned = raw;
	for (const pattern of RECEIPT_TEXT_NOISE_PATTERNS) {
		cleaned = cleaned.replace(pattern, ' ');
	}
	return cleaned.replace(/\s+/g, ' ').trim();
}

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
		const trimmed = value.trim().replace(',', '.');
		return trimmed ? trimmed : undefined;
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return undefined;
}

function coerceReceiptUnit(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim().toLowerCase();
		return trimmed ? trimmed : undefined;
	}
	return undefined;
}

export function coerceReceiptPrice(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim().replace(',', '.');
		if (!trimmed) return undefined;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed.toFixed(2) : undefined;
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value.toFixed(2);
	}
	return undefined;
}

function coerceReceiptCurrency(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim().toUpperCase();
	return trimmed ? trimmed : undefined;
}

function coerceReceiptLocation(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim().toLowerCase();
		return isStorageLocation(trimmed) ? trimmed : undefined;
	}
	return undefined;
}

/** Maps a parsed receipt line to inventory quantity + unit. */
export function receiptLineToInventoryAmount(line: ReceiptLine): {
	quantity: string;
	unit: string | null;
} {
	const quantityRaw = line.quantity?.trim() || '1';
	const unitRaw = line.unit?.trim() || null;
	const { quantity: parsedQuantity, unit: parsedUnit } = parseSuggestionQuantity(quantityRaw);
	return {
		quantity: parsedQuantity ?? '1',
		unit: unitRaw ?? parsedUnit
	};
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
			normalized.quantity = quantity ?? '';
			const unit = coerceReceiptUnit(row.unit);
			normalized.unit = unit ?? '';
			const location = coerceReceiptLocation(row.location);
			normalized.location = location ?? '';
			normalized.unitPrice = coerceReceiptPrice(row.unitPrice) ?? null;
			normalized.lineTotal = coerceReceiptPrice(row.lineTotal) ?? null;
			normalized.currency = coerceReceiptCurrency(row.currency) ?? null;
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
		const unit = coerceReceiptUnit(row.unit);
		const unitPrice = coerceReceiptPrice(row.unitPrice);
		const lineTotal = coerceReceiptPrice(row.lineTotal);
		const currency = coerceReceiptCurrency(row.currency);
		if (!name) continue;
		const line: ReceiptLine = {
			name,
			location: resolveReceiptLineLocation(name, row.location)
		};
		if (quantity) line.quantity = quantity;
		if (unit) line.unit = unit;
		if (unitPrice) line.unitPrice = unitPrice;
		if (lineTotal) line.lineTotal = lineTotal;
		if (currency) line.currency = currency;
		result.push(line);
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
	const cleaned = preprocessReceiptText(receiptText);
	return requestReceiptStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: [
			'Lista matvaror från detta kvitto.',
			'Kvittoinnehåll:',
			cleaned.slice(0, 12_000)
		].join('\n\n')
	});
}
