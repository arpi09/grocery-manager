import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import type { StorageLocation } from '$lib/domain/location';
import { isStorageLocation } from '$lib/domain/location';
import type {
	PhotoRoundConfidence,
	PhotoRoundDetectedItem,
	PhotoRoundParseResult
} from '$lib/domain/photo-round';
import {
	openAiErrorLogDetail,
	requestStructuredJson,
	requestStructuredJsonFromImages,
	type OpenAiFailureResult,
	type StructuredJsonResult
} from '$lib/server/openai';

const LOCATION_ENUM = ['fridge', 'freezer', 'cupboard'] as const;

export const PHOTO_ROUND_ITEMS_SCHEMA = {
	type: 'object',
	properties: {
		detectedZone: { type: 'string', enum: LOCATION_ENUM },
		zoneConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					quantity: { type: 'string' },
					unit: { type: 'string' },
					confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
					location: { type: 'string', enum: LOCATION_ENUM }
				},
				required: ['name', 'quantity', 'unit', 'confidence', 'location'],
				additionalProperties: false
			}
		}
	},
	required: ['detectedZone', 'zoneConfidence', 'items'],
	additionalProperties: false
} as const;

const ZONE_CONTEXT: Record<StorageLocation, string> = {
	fridge: 'kylskåp (kyl)',
	freezer: 'frys',
	cupboard: 'skafferi/hyllor (torrförvaring)'
};

const LOCATION_RULES = [
	'- location per vara: fridge | freezer | cupboard (förvaring hemma)',
	'  - fridge: mejeri, kött, fisk, chark, färdigrätter, färska grönsaker, ägg, mat som ska kylas',
	'  - freezer: frysta varor, glass, djupfryst',
	'  - cupboard: torrvaror (ris, pasta torr, mjöl), konserver, kryddor, kaffe, te'
].join('\n');

export function photoRoundSystemPrompt(zoneHint: StorageLocation | null): string {
	const zoneLines = zoneHint
		? [
				`Förslag från användaren: ${ZONE_CONTEXT[zoneHint]}.`,
				'Om fotot tydligt visar en annan zon, sätt detectedZone och location därefter.'
			]
		: [
				'Identifiera zonen från fotot (kyl, frys eller skafferi) i detectedZone.',
				'zoneConfidence: high = tydlig kyl/frys/hylla, medium = delvis synlig, low = osäker.'
			];

	return [
		'Du inventerar ett svenskt hushålls skafferi från foton.',
		...zoneLines,
		'Returnera JSON: {"detectedZone":"fridge|freezer|cupboard","zoneConfidence":"high|medium|low","items":[{"name":"","quantity":"","unit":"","confidence":"high|medium|low","location":"fridge|freezer|cupboard"}]}',
		'Strikta regler (anti-hallucination):',
		'- Lista ENDAST livsmedel och drycker som är tydligt synliga i bilderna',
		'- Gissa INTE varor som kan finnas utanför bild eller bakom annat',
		'- Hoppa över förpackningar där namnet inte går att läsa',
		'- name: kort svenskt produktnamn (t.ex. "Mjölk", "Pasta penne")',
		'- quantity: numerisk mängd som sträng (standard "1")',
		'- unit: l, ml, kg, g, st, pack — tom sträng om okänd',
		'- confidence: high = tydligt läsbar etikett/hel förpackning, medium = delvis synlig, low = osäker',
		LOCATION_RULES,
		'- Slå ihop dubbletter av samma vara till en rad med summerad quantity om möjligt',
		'- max 30 rader'
	].join('\n');
}

export const PHOTO_ROUND_VALIDATION_PROMPT = [
	'Du granskar en lista med varor som en AI hävdade såg i skafferifoton.',
	'Returnera JSON: {"detectedZone":"fridge|freezer|cupboard","zoneConfidence":"high|medium|low","items":[{"name":"","quantity":"","unit":"","confidence":"high|medium|low","location":"fridge|freezer|cupboard"}]}',
	'Behåll ENDAST rader som sannolikt är synliga på hyllan/kylen — ta bort uppenbara hallucinationer.',
	'Behåll quantity/unit/confidence/location oförändrat om du behåller raden.',
	'Behåll detectedZone och zoneConfidence om de fortfarande stämmer med bilden.',
	'Om listan är tom, returnera {"detectedZone":"cupboard","zoneConfidence":"low","items":[]}.'
].join('\n');

function coerceName(value: unknown): string {
	if (typeof value === 'string') {
		return value.trim();
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return '';
}

function coerceQuantity(value: unknown): string {
	if (typeof value === 'string') {
		const trimmed = value.trim().replace(',', '.');
		return trimmed || '1';
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return '1';
}

function coerceUnit(value: unknown): string | null {
	if (typeof value === 'string') {
		const trimmed = value.trim().toLowerCase();
		return trimmed ? trimmed : null;
	}
	return null;
}

function coerceConfidence(value: unknown): PhotoRoundConfidence | null {
	if (value === 'high' || value === 'medium' || value === 'low') {
		return value;
	}
	return null;
}

function coerceLocation(value: unknown): StorageLocation | null {
	if (typeof value === 'string' && isStorageLocation(value.trim().toLowerCase())) {
		return value.trim().toLowerCase() as StorageLocation;
	}
	return null;
}

export function normalizePhotoRoundPayload(raw: unknown): unknown {
	if (!raw || typeof raw !== 'object') {
		return raw;
	}
	const payload = raw as Record<string, unknown>;
	const normalized: Record<string, unknown> = {};

	const detectedZone = coerceLocation(payload.detectedZone);
	if (detectedZone) {
		normalized.detectedZone = detectedZone;
	}
	const zoneConfidence = coerceConfidence(payload.zoneConfidence);
	if (zoneConfidence) {
		normalized.zoneConfidence = zoneConfidence;
	}

	if (!('items' in payload)) {
		return Object.keys(normalized).length > 0 ? normalized : raw;
	}

	const items = payload.items;
	if (!Array.isArray(items)) {
		return { ...normalized, items };
	}

	return {
		...normalized,
		items: items.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return entry;
			}
			const row = entry as Record<string, unknown>;
			return {
				name: coerceName(row.name),
				quantity: coerceQuantity(row.quantity),
				unit: coerceUnit(row.unit) ?? '',
				confidence: coerceConfidence(row.confidence) ?? 'low',
				location: coerceLocation(row.location) ?? ''
			};
		})
	};
}

export function parsePhotoRoundItems(
	raw: unknown,
	zoneHint: StorageLocation | null
): PhotoRoundDetectedItem[] {
	const normalized = normalizePhotoRoundPayload(raw);
	if (!normalized || typeof normalized !== 'object' || !('items' in normalized)) {
		return [];
	}
	const items = (normalized as { items: unknown }).items;
	if (!Array.isArray(items)) {
		return [];
	}

	const fallbackZone =
		zoneHint ??
		coerceLocation((normalized as { detectedZone?: unknown }).detectedZone) ??
		'cupboard';

	const result: PhotoRoundDetectedItem[] = [];
	const seen = new Set<string>();

	for (const entry of items) {
		if (!entry || typeof entry !== 'object') continue;
		const row = entry as Record<string, unknown>;
		const name = coerceName(row.name);
		const confidence = coerceConfidence(row.confidence);
		if (!name || !confidence) continue;

		const key = name.toLocaleLowerCase('sv-SE');
		if (seen.has(key)) continue;
		seen.add(key);

		result.push({
			name,
			quantity: coerceQuantity(row.quantity),
			unit: coerceUnit(row.unit),
			confidence,
			location: resolveReceiptLineLocation(name, row.location || fallbackZone)
		});
	}

	return result;
}

export function parsePhotoRoundResponse(
	raw: unknown,
	zoneHint: StorageLocation | null
): PhotoRoundParseResult {
	const normalized = normalizePhotoRoundPayload(raw);
	const detectedZone =
		zoneHint ??
		(normalized && typeof normalized === 'object' && 'detectedZone' in normalized
			? coerceLocation((normalized as { detectedZone: unknown }).detectedZone)
			: null) ??
		'cupboard';
	const zoneConfidence =
		zoneHint !== null
			? 'high'
			: normalized && typeof normalized === 'object' && 'zoneConfidence' in normalized
				? (coerceConfidence((normalized as { zoneConfidence: unknown }).zoneConfidence) ?? 'low')
				: 'low';

	return {
		items: parsePhotoRoundItems(raw, zoneHint ?? detectedZone),
		detectedZone,
		zoneConfidence
	};
}

function isOpenAiSchemaFailure(result: OpenAiFailureResult): boolean {
	const detail = openAiErrorLogDetail(result).toLowerCase();
	return detail.includes('json_schema') || detail.includes('invalid schema');
}

async function requestPhotoRoundStructured(
	apiKey: string,
	options: {
		systemPrompt: string;
		userPrompt: string;
		imageDataUrls: string[];
	}
): Promise<StructuredJsonResult> {
	const base = {
		systemPrompt: options.systemPrompt,
		userPrompt: options.userPrompt,
		schemaName: 'photo_round_items',
		schema: PHOTO_ROUND_ITEMS_SCHEMA
	};

	const strictResult =
		options.imageDataUrls.length > 0
			? await requestStructuredJsonFromImages(apiKey, {
					...base,
					imageDataUrls: options.imageDataUrls
				})
			: await requestStructuredJson(apiKey, base);

	if (strictResult.ok || !isOpenAiSchemaFailure(strictResult)) {
		return strictResult;
	}

	return options.imageDataUrls.length > 0
		? await requestStructuredJsonFromImages(apiKey, {
				...base,
				imageDataUrls: options.imageDataUrls,
				strict: false
			})
		: await requestStructuredJson(apiKey, { ...base, strict: false });
}

export async function parsePhotoRoundFromImages(
	apiKey: string,
	zoneHint: StorageLocation | null,
	imageDataUrls: string[],
	options?: { validate?: boolean }
): Promise<
	| ({ ok: true } & PhotoRoundParseResult)
	| ({ ok: false } & OpenAiFailureResult)
> {
	const initial = await requestPhotoRoundStructured(apiKey, {
		systemPrompt: photoRoundSystemPrompt(zoneHint),
		userPrompt: zoneHint
			? `Inventera varorna i ${ZONE_CONTEXT[zoneHint]} från ${imageDataUrls.length} foto.`
			: `Inventera varorna och identifiera zonen från ${imageDataUrls.length} foto.`,
		imageDataUrls
	});

	if (!initial.ok) {
		return initial;
	}

	let parsed = parsePhotoRoundResponse(initial.data, zoneHint);
	if (parsed.items.length === 0) {
		return { ok: true, ...parsed };
	}

	if (options?.validate !== false && parsed.items.length > 0) {
		const summary = parsed.items
			.map(
				(item) =>
					`- ${item.name} (${item.quantity}${item.unit ? ` ${item.unit}` : ''}, ${item.location})`
			)
			.join('\n');
		const validation = await requestPhotoRoundStructured(apiKey, {
			systemPrompt: PHOTO_ROUND_VALIDATION_PROMPT,
			userPrompt: `Zon: ${ZONE_CONTEXT[parsed.detectedZone]}.\nFöreslagna varor:\n${summary}`,
			imageDataUrls: []
		});
		if (validation.ok) {
			const validated = parsePhotoRoundResponse(validation.data, zoneHint);
			if (validated.items.length > 0) {
				parsed = validated;
			}
		}
	}

	return { ok: true, ...parsed };
}

export function isPhotoRoundZone(value: string): value is StorageLocation {
	return isStorageLocation(value);
}

export function parsePhotoRoundZoneHint(value: unknown): StorageLocation | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().toLowerCase();
	if (!trimmed || trimmed === 'auto') return null;
	return isPhotoRoundZone(trimmed) ? trimmed : null;
}
