import { Buffer } from 'node:buffer';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requestStructuredJsonFromImage } from '$lib/server/openai';
import type { RequestHandler } from './$types';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const IMAGE_PRODUCT_SCHEMA = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		quantity: { type: 'string' },
		unit: { type: 'string' },
		notes: { type: 'string' },
		confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
	},
	required: ['name', 'quantity', 'unit', 'notes', 'confidence'],
	additionalProperties: false
} as const;

const SYSTEM_PROMPT = [
	'You extract grocery product data from a photo label.',
	'Output JSON only with:',
	'{"name":"","quantity":"","unit":"","notes":"","confidence":"high|medium|low"}',
	'Rules:',
	'- name: short product name in English',
	'- quantity: numeric-like string (fallback "1")',
	'- unit: common short unit or empty string',
	'- notes: short useful details (brand/flavor/size) or empty string',
	'- confidence is high when label is very clear, medium when mostly clear, low when uncertain',
	'- never output markdown code fences'
].join('\n');

interface ImageProduct {
	name: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
	confidence: 'high' | 'medium' | 'low';
}

function parseProduct(raw: unknown): ImageProduct | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}

	const obj = raw as Record<string, unknown>;
	const name = typeof obj.name === 'string' ? obj.name.trim() : '';
	const quantity = typeof obj.quantity === 'string' ? obj.quantity.trim() : '1';
	const unit = typeof obj.unit === 'string' && obj.unit.trim() ? obj.unit.trim() : null;
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

		const apiKeyOrResponse = requireOpenAiKey('photo product scan', 503);
		if (typeof apiKeyOrResponse !== 'string') {
			return apiKeyOrResponse;
		}
		const apiKey = apiKeyOrResponse;

		const formData = await request.formData();
		const image = formData.get('image');
		if (!(image instanceof File)) {
			return json({ error: 'No image uploaded.' }, { status: 400 });
		}

		if (!image.type.startsWith('image/')) {
			return json({ error: 'Uploaded file must be an image.' }, { status: 400 });
		}

		if (image.size > MAX_IMAGE_BYTES) {
			return json(
				{ error: 'Image is too large. Please upload an image under 6 MB.' },
				{ status: 413 }
			);
		}

		const bytes = await image.arrayBuffer();
		const base64 = Buffer.from(bytes).toString('base64');
		const dataUrl = `data:${image.type};base64,${base64}`;

		const result = await requestStructuredJsonFromImage(apiKey, {
			systemPrompt: SYSTEM_PROMPT,
			userPrompt: 'Extract product fields from this image.',
			imageDataUrl: dataUrl,
			schemaName: 'image_product',
			schema: IMAGE_PRODUCT_SCHEMA
		});

		if (!result.ok) {
			return json({ error: result.message }, { status: result.status });
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
			{ error: 'Photo product scan failed unexpectedly. Please try again.' },
			{ status: 503 }
		);
	}
};
