import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { isStorageLocation } from '$lib/domain/location';
import {
	LOCATION_RULES,
	storeChainHintBlock,
	SWEDISH_GROCERY_CONTEXT,
	UNIT_RULES
} from '$lib/server/ai-prompt-shared';
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

export type ReceiptLineConfidence = 'high' | 'medium' | 'low';

export interface ReceiptParseMetadata {
	chain?: string | null;
	storeName?: string | null;
	purchasedAt?: string | null;
}

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
					currency: { type: ['string', 'null'] },
					brand: { type: ['string', 'null'] },
					packageSize: { type: ['string', 'null'] },
					categoryHint: { type: ['string', 'null'] },
					lineConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
					rawLineText: { type: ['string', 'null'] },
					confidence: { type: ['number', 'null'] }
				},
				required: [
					'name',
					'quantity',
					'unit',
					'location',
					'unitPrice',
					'lineTotal',
					'currency',
					'brand',
					'packageSize',
					'categoryHint',
					'lineConfidence',
					'rawLineText',
					'confidence'
				],
				additionalProperties: false
			}
		}
	},
	required: ['lines'],
	additionalProperties: false
} as const;

export const RECEIPT_SYSTEM_PROMPT = [
	'Du läser svenska butikskvitton och extraherar livsmedelsrader som JSON enligt schema.',
	SWEDISH_GROCERY_CONTEXT,
	'Regler:',
	'- name: kort produktnamn utan storlek/vikt (t.ex. "Coca-Cola", inte "Coca-Cola 1,5L")',
	'- brand: varumärke om synligt (Arla, ICA, Garant), annars null',
	'- packageSize: förpackningsstorlek (t.ex. "500 g", "1,5 l") när den syns, annars null',
	'- categoryHint: grov kategori (mejeri, kött, grönsak, torrvara, dryck, färdigrätt), annars null',
	'- lineConfidence: high|medium|low — hur säker du är på raden',
	'- rawLineText: originalrad från kvittot om tillgänglig, annars null',
	'- unitPrice/lineTotal: pris med punkt som decimal, annars null',
	'- currency: ISO-kod (oftast "SEK"), annars null',
	UNIT_RULES,
	LOCATION_RULES,
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
export function preprocessReceiptText(raw: string, storeHint?: string | null): string {
	let cleaned = raw;
	for (const pattern of RECEIPT_TEXT_NOISE_PATTERNS) {
		cleaned = cleaned.replace(pattern, ' ');
	}
	cleaned = preprocessIcaStoreLayout(cleaned, storeHint);
	return cleaned.replace(/\s+/g, ' ').trim();
}

/** ICA Maxi / Supermarket / Kvantum — normalize line breaks and EAN noise. */
function preprocessIcaStoreLayout(text: string, storeHint?: string | null): string {
	let t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	const hint = (storeHint ?? text).toLowerCase();

	// Strip long EAN / artikelnummer runs (12–14 digits) common on ICA lines
	t = t.replace(/\b\d{12,14}\b/g, ' ');

	// Gunnesbo / Toftanäs Maxi: product lines often split before price column
	if (hint.includes('gunnesbo') || hint.includes('toftan')) {
		t = t.replace(/(\d+[.,]\d{2})\s*(?:kr|sek)?\s*(?=[A-ZÅÄÖ])/gi, '$1\n');
	}

	// Värnhem Supermarket: compact header — ensure product boundaries
	if (hint.includes('varnhem') || hint.includes('supermarket')) {
		t = t.replace(/(\d+[.,]\d{2})\s+/g, '$1\n');
	}

	// Strömstad Kvantum: pant/deposit lines inline
	if (hint.includes('stromstad') || hint.includes('strömstad') || hint.includes('kvantum')) {
		t = t.replace(/\bpant\s*\d+[.,]?\d*/gi, ' ');
	}

	// Kivra-style export: collapse duplicate store headers at line start only
	if (hint.includes('kivra')) {
		t = t.replace(
			/^(?:maxi\s+ica|ica\s+supermarket|ica\s+kvantum)[^\n]{0,80}\n/gim,
			''
		);
	}

	return t.replace(/\n+/g, '\n');
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

function coerceReceiptOptionalString(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed ? trimmed : undefined;
}

function coerceReceiptNullableString(value: unknown): string | null {
	return coerceReceiptOptionalString(value) ?? null;
}

function coerceReceiptCurrency(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim().toUpperCase();
	return trimmed ? trimmed : undefined;
}

function coerceReceiptConfidence(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.min(1, Math.max(0, value));
	}
	return undefined;
}

function coerceLineConfidence(value: unknown): ReceiptLineConfidence | undefined {
	if (value === 'high' || value === 'medium' || value === 'low') {
		return value;
	}
	return undefined;
}

function lineConfidenceToNumeric(confidence: ReceiptLineConfidence): number {
	switch (confidence) {
		case 'high':
			return 0.9;
		case 'medium':
			return 0.6;
		default:
			return 0.35;
	}
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
			normalized.brand = coerceReceiptNullableString(row.brand);
			normalized.packageSize = coerceReceiptNullableString(row.packageSize);
			normalized.categoryHint = coerceReceiptNullableString(row.categoryHint);
			normalized.lineConfidence = coerceLineConfidence(row.lineConfidence) ?? 'medium';
			if (!('lineConfidence' in row)) {
				delete normalized.lineConfidence;
			}
			normalized.rawLineText = coerceReceiptNullableString(row.rawLineText);
			if (!('rawLineText' in row)) {
				delete normalized.rawLineText;
			}
			normalized.confidence =
				typeof row.confidence === 'number' ? row.confidence : (row.confidence ?? null);
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
		const brand = coerceReceiptOptionalString(row.brand);
		const packageSize = coerceReceiptOptionalString(row.packageSize);
		const categoryHint = coerceReceiptOptionalString(row.categoryHint);
		const lineConfidence = coerceLineConfidence(row.lineConfidence);
		const confidence =
			coerceReceiptConfidence(row.confidence) ??
			(lineConfidence ? lineConfidenceToNumeric(lineConfidence) : undefined);
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
		if (brand) line.brand = brand;
		if (packageSize) line.packageSize = packageSize;
		if (categoryHint) line.categoryHint = categoryHint;
		if (confidence != null) line.confidence = confidence;
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
	imageDetail?: 'auto' | 'high' | 'low';
};

function buildReceiptMetadataBlock(metadata?: ReceiptParseMetadata): string {
	if (!metadata) return '';
	const parts: string[] = [];
	if (metadata.chain) parts.push(`Kedja: ${metadata.chain}`);
	if (metadata.storeName) parts.push(`Butik: ${metadata.storeName}`);
	if (metadata.purchasedAt) parts.push(`Inköpsdatum: ${metadata.purchasedAt}`);
	const chainHint = storeChainHintBlock(metadata.chain);
	if (chainHint) parts.push(chainHint);
	return parts.length > 0 ? parts.join('\n') : '';
}

/** Formats preprocessed receipt text with line numbers for text-based parse. */
export function formatNumberedReceiptText(cleaned: string): string {
	const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
	if (lines.length === 0) return cleaned;
	return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

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
		? await requestStructuredJsonFromImage(apiKey, {
				...base,
				imageDataUrl: options.imageDataUrl,
				imageDetail: options.imageDetail ?? 'auto'
			})
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
				imageDetail: options.imageDetail ?? 'auto',
				strict: false
			})
		: await requestStructuredJson(apiKey, { ...base, strict: false });
}

export async function parseReceiptFromImage(
	apiKey: string,
	imageDataUrl: string,
	metadata?: ReceiptParseMetadata
) {
	const metaBlock = buildReceiptMetadataBlock(metadata);
	return requestReceiptStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: ['Lista matvaror från detta kvitto.', metaBlock].filter(Boolean).join('\n\n'),
		imageDataUrl
	});
}

export async function parseReceiptFromText(
	apiKey: string,
	receiptText: string,
	storeHint?: string | null,
	metadata?: ReceiptParseMetadata
) {
	const cleaned = preprocessReceiptText(receiptText, storeHint);
	const mergedMetadata: ReceiptParseMetadata = {
		chain: metadata?.chain ?? storeHint ?? null,
		storeName: metadata?.storeName ?? storeHint ?? null,
		purchasedAt: metadata?.purchasedAt ?? null
	};
	const metaBlock = buildReceiptMetadataBlock(mergedMetadata);
	const numbered = formatNumberedReceiptText(cleaned.slice(0, 12_000));
	return requestReceiptStructuredJson(apiKey, {
		systemPrompt: RECEIPT_SYSTEM_PROMPT,
		userPrompt: [
			'Lista matvaror från detta kvitto.',
			metaBlock,
			'Kvittoinnehåll (radnummer):',
			numbered
		]
			.filter(Boolean)
			.join('\n\n')
	});
}
