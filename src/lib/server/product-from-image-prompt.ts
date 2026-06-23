import type { StorageLocation } from '$lib/domain/location';
import { isStorageLocation } from '$lib/domain/location';
import {
	normalizePromptLocale,
	PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	promptLocaleInstruction,
	promptLocaleTag
} from '$lib/server/ai-prompt-shared';

export const PRODUCT_FROM_IMAGE_SCHEMA = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		quantity: { type: 'string' },
		unit: { type: 'string' },
		expiresOn: { type: 'string' },
		notes: { type: 'string' },
		confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
		normalizedKey: { type: 'string' }
	},
	required: ['name', 'quantity', 'unit', 'expiresOn', 'notes', 'confidence', 'normalizedKey'],
	additionalProperties: false
} as const;

const LOCATION_HINT_LABELS: Record<StorageLocation, string> = {
	fridge: 'kyl',
	freezer: 'frys',
	cupboard: 'skafferi'
};

export function buildProductFromImageSystemPrompt(
	locale: string,
	feedback?: { priorCorrectionsBlock?: string; globalFewShotBlock?: string }
): string {
	const promptLocale = normalizePromptLocale(locale);
	const nameRule =
		promptLocale === 'en'
			? '- name: short product name in English'
			: '- name: kort svenskt produktnamn';
	return [
		promptLocale === 'en'
			? 'You extract grocery product data from a photo label.'
			: 'Du extraherar livsmedelsdata från en produktetikett.',
		promptLocaleInstruction(promptLocale),
		feedback?.priorCorrectionsBlock?.trim(),
		feedback?.globalFewShotBlock?.trim(),
		'Output JSON only with:',
		'{"name":"","quantity":"","unit":"","expiresOn":"","notes":"","confidence":"high|medium|low","normalizedKey":""}',
		'Rules:',
		nameRule,
		'- quantity: numeric-like string (fallback "1")',
		'- unit: common short unit (st, g, kg, l, ml, förp, pack) or empty string',
		'- expiresOn: best-before / use-by date as YYYY-MM-DD when visible on the label, otherwise empty string',
		'- notes: short useful details (flavor/size) or empty string',
		'- normalizedKey: lowercase merge key without brand/size (e.g. "mjolk", "pasta penne") for pantry dedupe',
		'- confidence is high when label is very clear, medium when mostly clear, low when uncertain',
		'- never output markdown code fences',
		`promptVersion: ${PROMPT_VERSION_PRODUCT_FROM_IMAGE}`
	]
		.filter(Boolean)
		.join('\n');
}

export function parseProductFromImageLocationHint(value: unknown): StorageLocation | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) return null;
	return isStorageLocation(trimmed) ? trimmed : null;
}

export function buildProductFromImageUserPrompt(
	locale: string,
	locationHint: StorageLocation | null
): string {
	const promptLocale = normalizePromptLocale(locale);
	const payload: Record<string, unknown> = {
		promptVersion: PROMPT_VERSION_PRODUCT_FROM_IMAGE,
		locale: promptLocaleTag(promptLocale),
		instruction: 'Extract product fields from this image.'
	};
	if (locationHint) {
		payload.locationHint = locationHint;
		payload.storageHint = LOCATION_HINT_LABELS[locationHint];
	}
	return JSON.stringify(payload);
}
