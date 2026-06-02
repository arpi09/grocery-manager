import type { StorageLocation } from '$lib/domain/location';
import { isStorageLocation } from '$lib/domain/location';
import type { PhotoRoundConfidence, PhotoRoundDetectedItem } from '$lib/domain/photo-round';
import {
	openAiErrorLogDetail,
	requestStructuredJson,
	requestStructuredJsonFromImages,
	type OpenAiFailureResult,
	type StructuredJsonResult
} from '$lib/server/openai';

export const PHOTO_ROUND_ITEMS_SCHEMA = {
	type: 'object',
	properties: {
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					quantity: { type: 'string' },
					unit: { type: 'string' },
					confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
				},
				required: ['name', 'quantity', 'unit', 'confidence'],
				additionalProperties: false
			}
		}
	},
	required: ['items'],
	additionalProperties: false
} as const;

const ZONE_CONTEXT: Record<StorageLocation, string> = {
	fridge: 'kylskåp (kyl)',
	freezer: 'frys',
	cupboard: 'skafferi/hyllor (torrförvaring)'
};

export function photoRoundSystemPrompt(zone: StorageLocation): string {
	const zoneLabel = ZONE_CONTEXT[zone];
	return [
		'Du inventerar ett svenskt hushålls skafferi från foton.',
		`Zon: ${zoneLabel}. Alla varor ska förvaras i denna zon.`,
		'Returnera JSON: {"items":[{"name":"","quantity":"","unit":"","confidence":"high|medium|low"}]}',
		'Strikta regler (anti-hallucination):',
		'- Lista ENDAST livsmedel och drycker som är tydligt synliga i bilderna',
		'- Gissa INTE varor som kan finnas utanför bild eller bakom annat',
		'- Hoppa över förpackningar där namnet inte går att läsa',
		'- name: kort svenskt produktnamn (t.ex. "Mjölk", "Pasta penne")',
		'- quantity: numerisk mängd som sträng (standard "1")',
		'- unit: l, ml, kg, g, st, pack — tom sträng om okänd',
		'- confidence: high = tydligt läsbar etikett/hel förpackning, medium = delvis synlig, low = osäker',
		'- Slå ihop dubbletter av samma vara till en rad med summerad quantity om möjligt',
		'- max 30 rader'
	].join('\n');
}

export const PHOTO_ROUND_VALIDATION_PROMPT = [
	'Du granskar en lista med varor som en AI hävdade såg i skafferifoton.',
	'Returnera JSON: {"items":[{"name":"","quantity":"","unit":"","confidence":"high|medium|low"}]}',
	'Behåll ENDAST rader som sannolikt är synliga på hyllan/kylen — ta bort uppenbara hallucinationer.',
	'Behåll quantity/unit/confidence oförändrat om du behåller raden.',
	'Om listan är tom, returnera {"items":[]}.'
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

export function normalizePhotoRoundPayload(raw: unknown): unknown {
	if (!raw || typeof raw !== 'object' || !('items' in raw)) {
		return raw;
	}
	const items = (raw as { items: unknown }).items;
	if (!Array.isArray(items)) {
		return raw;
	}
	return {
		items: items.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return entry;
			}
			const row = entry as Record<string, unknown>;
			return {
				name: coerceName(row.name),
				quantity: coerceQuantity(row.quantity),
				unit: coerceUnit(row.unit) ?? '',
				confidence: coerceConfidence(row.confidence) ?? 'low'
			};
		})
	};
}

export function parsePhotoRoundItems(
	raw: unknown,
	zone: StorageLocation
): PhotoRoundDetectedItem[] {
	const normalized = normalizePhotoRoundPayload(raw);
	if (!normalized || typeof normalized !== 'object' || !('items' in normalized)) {
		return [];
	}
	const items = (normalized as { items: unknown }).items;
	if (!Array.isArray(items)) {
		return [];
	}

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
			location: zone
		});
	}

	return result;
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
	zone: StorageLocation,
	imageDataUrls: string[],
	options?: { validate?: boolean }
): Promise<
	| { ok: true; items: PhotoRoundDetectedItem[] }
	| ({ ok: false } & OpenAiFailureResult)
> {
	const initial = await requestPhotoRoundStructured(apiKey, {
		systemPrompt: photoRoundSystemPrompt(zone),
		userPrompt: `Inventera varorna i ${ZONE_CONTEXT[zone]} från ${imageDataUrls.length} foto.`,
		imageDataUrls
	});

	if (!initial.ok) {
		return initial;
	}

	let items = parsePhotoRoundItems(initial.data, zone);
	if (items.length === 0) {
		return { ok: true, items: [] };
	}

	if (options?.validate !== false && items.length > 0) {
		const summary = items
			.map((item) => `- ${item.name} (${item.quantity}${item.unit ? ` ${item.unit}` : ''})`)
			.join('\n');
		const validation = await requestPhotoRoundStructured(apiKey, {
			systemPrompt: PHOTO_ROUND_VALIDATION_PROMPT,
			userPrompt: `Zon: ${ZONE_CONTEXT[zone]}.\nFöreslagna varor:\n${summary}`,
			imageDataUrls: []
		});
		if (validation.ok) {
			const validated = parsePhotoRoundItems(validation.data, zone);
			if (validated.length > 0) {
				items = validated;
			}
		}
	}

	return { ok: true, items };
}

export function isPhotoRoundZone(value: string): value is StorageLocation {
	return isStorageLocation(value);
}
