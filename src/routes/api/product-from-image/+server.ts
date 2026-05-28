import { Buffer } from 'node:buffer';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4.1-mini';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

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

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return json(
			{
				error:
					'OPENAI_API_KEY is missing. Add it to your .env before using photo product scan.'
			},
			{ status: 500 }
		);
	}

	const formData = await request.formData();
	const image = formData.get('image');
	if (!(image instanceof File)) {
		return json({ error: 'No image uploaded.' }, { status: 400 });
	}

	if (!image.type.startsWith('image/')) {
		return json({ error: 'Uploaded file must be an image.' }, { status: 400 });
	}

	if (image.size > MAX_IMAGE_BYTES) {
		return json({ error: 'Image is too large. Please upload an image under 6 MB.' }, { status: 413 });
	}

	const bytes = await image.arrayBuffer();
	const base64 = Buffer.from(bytes).toString('base64');
	const dataUrl = `data:${image.type};base64,${base64}`;

	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: MODEL,
			input: [
				{
					role: 'system',
					content: [
						{
							type: 'input_text',
							text: [
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
							].join('\n')
						}
					]
				},
				{
					role: 'user',
					content: [
						{ type: 'input_text', text: 'Extract product fields from this image.' },
						{ type: 'input_image', image_url: dataUrl }
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'image_product',
					schema: {
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
					}
				}
			}
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		return json(
			{ error: `OpenAI request failed: ${response.status} ${errorText.slice(0, 300)}` },
			{ status: 502 }
		);
	}

	const payload = (await response.json()) as { output_text?: unknown };
	const outputText = typeof payload.output_text === 'string' ? payload.output_text : '';
	let parsed: unknown = null;
	try {
		parsed = JSON.parse(outputText);
	} catch {
		return json({ error: 'Model response was not valid JSON.' }, { status: 502 });
	}

	const product = parseProduct(parsed);
	if (!product) {
		return json({ error: 'Could not extract product fields from image.' }, { status: 502 });
	}

	return json({ product });
};
