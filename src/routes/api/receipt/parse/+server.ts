import { Buffer } from 'node:buffer';
import type { ReceiptLine, ReceiptParseResult } from '$lib/domain/receipt-line';
import { getOpenAiApiKey, missingOpenAiKeyMessage } from '$lib/server/openai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4.1-mini';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseLines(raw: unknown): ReceiptLine[] {
	if (!raw || typeof raw !== 'object' || !('lines' in raw)) {
		return [];
	}
	const lines = (raw as { lines: unknown }).lines;
	if (!Array.isArray(lines)) {
		return [];
	}

	const result: ReceiptLine[] = [];
	for (const entry of lines) {
		if (!entry || typeof entry !== "object") continue;
		const row = entry as Record<string, unknown>;
		const name = typeof row.name === "string" ? row.name.trim() : "";
		const quantity =
			typeof row.quantity === "string" && row.quantity.trim() ? row.quantity.trim() : undefined;
		if (!name) continue;
		result.push(quantity ? { name, quantity } : { name });
	}
	return result;
}

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const apiKey = getOpenAiApiKey();
	if (!apiKey) {
		return json({ error: missingOpenAiKeyMessage('receipt scan') }, { status: 500 });
	}

	const formData = await request.formData();
	const image = formData.get('image');
	if (!(image instanceof File)) {
		return json({ error: 'Ingen bild uppladdad.' }, { status: 400 });
	}

	if (!image.type.startsWith('image/')) {
		return json({ error: 'Filen måste vara en bild.' }, { status: 400 });
	}

	if (image.size > MAX_IMAGE_BYTES) {
		return json({ error: 'Bilden är för stor (max 8 MB).' }, { status: 413 });
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
								'Du läser svenska butikskvitton och extraherar livsmedelsrader.',
								'Returnera JSON: {"lines":[{"name":"","quantity":""}]}',
								'Regler:',
								'- name: kort svenskt produktnamn (ingen rabatt/MOMS/total/kortrad)',
								'- quantity: valfri mängd som sträng (t.ex. "2" eller "1.5 kg"), utelämna om oklart',
								'- hoppa över icke-mat, pant, erbjudanden och butiksinfo',
								'- max 40 rader'
							].join('\n')
						}
					]
				},
				{
					role: 'user',
					content: [
						{ type: 'input_text', text: 'Lista matvaror från detta kvitto.' },
						{ type: 'input_image', image_url: dataUrl }
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'receipt_lines',
					schema: {
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
									required: ['name'],
									additionalProperties: false
								}
							}
						},
						required: ['lines'],
						additionalProperties: false
					}
				}
			}
		})
	});

	if (!response.ok) {
		return json(
			{ error: `Kunde inte läsa kvittot (${response.status}). Försök med en tydligare bild.` },
			{ status: 502 }
		);
	}

	const payload = (await response.json()) as { output_text?: unknown };
	const outputText = typeof payload.output_text === 'string' ? payload.output_text : '';
	let parsed: unknown = null;
	try {
		parsed = JSON.parse(outputText);
	} catch {
		return json({ error: 'Kunde inte tolka svaret från AI.' }, { status: 502 });
	}

	const lines = parseLines(parsed);
	if (lines.length === 0) {
		return json(
			{ error: 'Inga varor hittades på kvittot. Prova en skarpare bild eller annan vinkel.' },
			{ status: 422 }
		);
	}

	const result: ReceiptParseResult = { lines };
	return json(result);
};
