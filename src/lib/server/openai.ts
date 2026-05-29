const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
export const OPENAI_MODEL = 'gpt-4.1-mini';

export function getOpenAiApiKey(): string | null {
	const key = process.env.OPENAI_API_KEY?.trim();
	return key ? key : null;
}

export function missingOpenAiKeyMessage(feature: string): string {
	return `OPENAI_API_KEY is missing. Add it to your .env before using ${feature}.`;
}

export function safeParseModelJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/** Maps upstream OpenAI HTTP status to a client-facing status. */
export function mapOpenAiFailureStatus(openAiStatus: number): number {
	if (openAiStatus === 401 || openAiStatus === 403 || openAiStatus === 429) {
		return 503;
	}
	return 502;
}

export function openAiFailureMessage(openAiStatus: number, errorText: string): string {
	if (openAiStatus === 401 || openAiStatus === 403) {
		return (
			'OpenAI API key is invalid or unauthorized. Set a valid OPENAI_API_KEY secret in Firebase App Hosting ' +
			'(firebase apphosting:secrets:set OPENAI_API_KEY and grantaccess for backend home-pantry).'
		);
	}
	if (openAiStatus === 429) {
		return 'OpenAI rate limit reached. Please try again in a moment.';
	}
	const detail = errorText.trim().slice(0, 300);
	return detail
		? `OpenAI request failed: ${openAiStatus} ${detail}`
		: `OpenAI request failed (${openAiStatus}).`;
}

interface StructuredResponseOptions {
	systemPrompt: string;
	userPrompt: string;
	schemaName: string;
	schema: Record<string, unknown>;
}

interface StructuredImageResponseOptions extends StructuredResponseOptions {
	imageDataUrl: string;
}

type StructuredJsonResult =
	| { ok: true; data: unknown }
	| { ok: false; status: number; message: string };

async function postOpenAiStructured(
	apiKey: string,
	input: unknown[],
	schemaName: string,
	schema: Record<string, unknown>
): Promise<StructuredJsonResult> {
	let response: Response;
	try {
		response = await fetch(OPENAI_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: OPENAI_MODEL,
				input,
				text: {
					format: {
						type: 'json_schema',
						name: schemaName,
						strict: true,
						schema
					}
				}
			})
		});
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'network error';
		return {
			ok: false,
			status: 503,
			message: `OpenAI request failed: ${detail}`
		};
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		return {
			ok: false,
			status: mapOpenAiFailureStatus(response.status),
			message: openAiFailureMessage(response.status, errorText)
		};
	}

	let payload: { output_text?: unknown };
	try {
		payload = (await response.json()) as { output_text?: unknown };
	} catch {
		return {
			ok: false,
			status: 502,
			message: 'OpenAI returned an unreadable response body.'
		};
	}

	const outputText = typeof payload.output_text === 'string' ? payload.output_text : '';
	return { ok: true, data: safeParseModelJson(outputText) };
}

export async function requestStructuredJson(
	apiKey: string,
	options: StructuredResponseOptions
): Promise<StructuredJsonResult> {
	return postOpenAiStructured(
		apiKey,
		[
			{
				role: 'system',
				content: [{ type: 'input_text', text: options.systemPrompt }]
			},
			{
				role: 'user',
				content: [{ type: 'input_text', text: options.userPrompt }]
			}
		],
		options.schemaName,
		options.schema
	);
}

export async function requestStructuredJsonFromImage(
	apiKey: string,
	options: StructuredImageResponseOptions
): Promise<StructuredJsonResult> {
	return postOpenAiStructured(
		apiKey,
		[
			{
				role: 'system',
				content: [{ type: 'input_text', text: options.systemPrompt }]
			},
			{
				role: 'user',
				content: [
					{ type: 'input_text', text: options.userPrompt },
					{ type: 'input_image', image_url: options.imageDataUrl }
				]
			}
		],
		options.schemaName,
		options.schema
	);
}
