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

interface StructuredResponseOptions {
	systemPrompt: string;
	userPrompt: string;
	schemaName: string;
	schema: Record<string, unknown>;
}

export async function requestStructuredJson(
	apiKey: string,
	options: StructuredResponseOptions
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; message: string }> {
	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: OPENAI_MODEL,
			input: [
				{
					role: 'system',
					content: [{ type: 'input_text', text: options.systemPrompt }]
				},
				{
					role: 'user',
					content: [{ type: 'input_text', text: options.userPrompt }]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: options.schemaName,
					schema: options.schema
				}
			}
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		return {
			ok: false,
			status: response.status,
			message: `OpenAI request failed: ${response.status} ${errorText.slice(0, 300)}`
		};
	}

	const payload = (await response.json()) as { output_text?: unknown };
	const outputText = typeof payload.output_text === 'string' ? payload.output_text : '';
	return { ok: true, data: safeParseModelJson(outputText) };
}
