import { Buffer } from 'node:buffer';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import {
	normalizePromptLocale,
	PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	promptLocaleInstruction,
	promptLocaleTag
} from '$lib/server/ai-prompt-shared';
import { OPENAI_MODEL_NANO, requestStructuredJsonFromImage, translateOpenAiError } from '$lib/server/openai';
import type { RequestHandler } from './$types';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const IMAGE_PRODUCT_SCHEMA = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		quantity: { type: 'string' },
		unit: { type: 'string' },
		expiresOn: { type: 'string' },
		notes: { type: 'string' },
		confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
	},
	required: ['name', 'quantity', 'unit', 'expiresOn', 'notes', 'confidence'],
	additionalProperties: false
} as const;

function buildProductFromImageSystemPrompt(locale: string): string {
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
		'Output JSON only with:',
		'{"name":"","quantity":"","unit":"","expiresOn":"","notes":"","confidence":"high|medium|low"}',
		'Rules:',
		nameRule,
		'- quantity: numeric-like string (fallback "1")',
		'- unit: common short unit (st, g, kg, l, ml, förp, pack) or empty string',
		'- expiresOn: best-before / use-by date as YYYY-MM-DD when visible on the label, otherwise empty string',
		'- notes: short useful details (brand/flavor/size) or empty string',
		'- confidence is high when label is very clear, medium when mostly clear, low when uncertain',
		'- never output markdown code fences',
		`promptVersion: ${PROMPT_VERSION_PRODUCT_FROM_IMAGE}`
	].join('\n');
}

interface ImageProduct {
	name: string;
	quantity: string;
	unit: string | null;
	expiresOn: string | null;
	notes: string | null;
	confidence: 'high' | 'medium' | 'low';
}

function parseExpiresOn(raw: unknown): string | null {
	if (typeof raw !== 'string') return null;
	const trimmed = raw.trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
	const [year, month, day] = trimmed.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}
	return trimmed;
}

function parseProduct(raw: unknown): ImageProduct | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const obj = raw as Record<string, unknown>;
	const name = typeof obj.name === 'string' ? obj.name.trim() : '';
	const quantity = typeof obj.quantity === 'string' ? obj.quantity.trim() : '1';
	const unit = typeof obj.unit === 'string' && obj.unit.trim() ? obj.unit.trim() : null;
	const expiresOn = parseExpiresOn(obj.expiresOn);
	const notes = typeof obj.notes === 'string' && obj.notes.trim() ? obj.notes.trim() : null;
	const confidence =
		obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
			? obj.confidence
			: null;

	if (!name || !confidence) {
		return null;
	}

	return {
		name,
		quantity: quantity || '1',
		unit,
		expiresOn,
		notes,
		confidence
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const auth = requireUser(locals);
		if (!auth.authorized) {
			return auth.response;
		}

		const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'photo product scan', 503);
		if (typeof apiKeyOrResponse !== 'string') {
			return apiKeyOrResponse;
		}
		const apiKey = apiKeyOrResponse;

		const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
		if (quotaResponse) {
			return quotaResponse;
		}

		const formData = await request.formData();
		const image = formData.get('image');
		if (!(image instanceof File)) {
			return json(
				{ error: translate(locals.locale, 'errors.api.productImageNoFile') },
				{ status: 400 }
			);
		}

		if (!image.type.startsWith('image/')) {
			return json(
				{ error: translate(locals.locale, 'errors.api.productImageNotImage') },
				{ status: 400 }
			);
		}

		if (image.size > MAX_IMAGE_BYTES) {
			return json(
				{ error: translate(locals.locale, 'errors.api.productImageTooLarge') },
				{ status: 413 }
			);
		}

		const bytes = await image.arrayBuffer();
		const base64 = Buffer.from(bytes).toString('base64');
		const dataUrl = `data:${image.type};base64,${base64}`;
		const promptLocale = normalizePromptLocale(locals.locale);

		const result = await requestStructuredJsonFromImage(apiKey, {
			model: OPENAI_MODEL_NANO,
			systemPrompt: buildProductFromImageSystemPrompt(locals.locale),
			userPrompt: JSON.stringify({
				promptVersion: PROMPT_VERSION_PRODUCT_FROM_IMAGE,
				locale: promptLocaleTag(promptLocale),
				instruction: 'Extract product fields from this image.'
			}),
			imageDataUrl: dataUrl,
			schemaName: 'image_product',
			schema: IMAGE_PRODUCT_SCHEMA
		});

		if (!result.ok) {
			return json({ error: translateOpenAiError(locals.locale, result) }, { status: result.status });
		}

		const product = parseProduct(result.data);
		if (!product) {
			return json(
				{ error: translate(locals.locale, 'errors.api.productImageParse') },
				{ status: 422 }
			);
		}

		return json({ product });
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'unexpected error';
		console.error('[product-from-image]', detail);
		return json(
			{ error: translate(locals.locale, 'errors.api.productImageUnexpected') },
			{ status: 503 }
		);
	}
};
