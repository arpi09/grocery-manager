import { env } from '$env/dynamic/private';
import type { Locale } from '$lib/i18n/locale';
import type { MessageKey } from '$lib/i18n/messages';
import { translate } from '$lib/i18n/messages';
import { recordOpenAiFailure, recordOpenAiSuccess } from '$lib/server/openai-circuit-breaker';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
export const OPENAI_MODEL = 'gpt-4.1-mini';
export const OPENAI_MODEL_NANO = env.OPENAI_MODEL_NANO?.trim() || 'gpt-4.1-nano';

export const OPENAI_NOT_CONFIGURED_KEY = 'errors.api.openAiNotConfigured' satisfies MessageKey;
export const OPENAI_UNAUTHORIZED_KEY = 'errors.api.openAiUnauthorized' satisfies MessageKey;
export const OPENAI_RATE_LIMIT_KEY = 'errors.api.openAiRateLimit' satisfies MessageKey;
export const OPENAI_REQUEST_FAILED_KEY = 'errors.api.openAiRequestFailed' satisfies MessageKey;
export const OPENAI_NETWORK_ERROR_KEY = 'errors.api.openAiNetworkError' satisfies MessageKey;
export const OPENAI_UNREADABLE_RESPONSE_KEY = 'errors.api.openAiUnreadableResponse' satisfies MessageKey;
export const OPENAI_EMPTY_RESPONSE_KEY = 'errors.api.openAiEmptyResponse' satisfies MessageKey;
export const OPENAI_INVALID_JSON_KEY = 'errors.api.openAiInvalidJson' satisfies MessageKey;

export function getOpenAiApiKey(): string | null {
	const key = env.OPENAI_API_KEY?.trim();
	return key ? key : null;
}

/** Server log detail when OPENAI_API_KEY is missing (not shown to users). */
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

/** Reads JSON text from Responses API payloads (output_text or output message parts). */
export function extractResponseOutputText(payload: unknown): string {
	if (!payload || typeof payload !== 'object') {
		return '';
	}

	const record = payload as Record<string, unknown>;
	if (typeof record.output_text === 'string' && record.output_text.trim()) {
		return record.output_text;
	}

	const output = record.output;
	if (!Array.isArray(output)) {
		return '';
	}

	const parts: string[] = [];
	for (const item of output) {
		if (!item || typeof item !== 'object') {
			continue;
		}
		const row = item as Record<string, unknown>;
		if (row.type !== 'message' || !Array.isArray(row.content)) {
			continue;
		}
		for (const block of row.content) {
			if (!block || typeof block !== 'object') {
				continue;
			}
			const content = block as Record<string, unknown>;
			if (content.type === 'output_text' && typeof content.text === 'string') {
				parts.push(content.text);
			}
		}
	}

	return parts.join('');
}

/** Maps upstream OpenAI HTTP status to a client-facing status. */
export function mapOpenAiFailureStatus(openAiStatus: number): number {
	if (openAiStatus === 401 || openAiStatus === 403 || openAiStatus === 429) {
		return 503;
	}
	return 502;
}

export function openAiFailureMessageKey(openAiStatus: number): MessageKey {
	if (openAiStatus === 401 || openAiStatus === 403) {
		return OPENAI_UNAUTHORIZED_KEY;
	}
	if (openAiStatus === 429) {
		return OPENAI_RATE_LIMIT_KEY;
	}
	return OPENAI_REQUEST_FAILED_KEY;
}

export type OpenAiFailureResult = {
	ok: false;
	status: number;
	messageKey: MessageKey;
	logDetail?: string;
};

export type StructuredJsonResult = { ok: true; data: unknown } | OpenAiFailureResult;

export function translateOpenAiError(locale: Locale, result: OpenAiFailureResult): string {
	return translate(locale, result.messageKey);
}

export function openAiErrorLogDetail(result: OpenAiFailureResult): string {
	return result.logDetail ?? result.messageKey;
}

interface StructuredResponseOptions {
	systemPrompt: string;
	userPrompt: string;
	schemaName: string;
	schema: Record<string, unknown>;
	strict?: boolean;
	model?: string;
}

interface StructuredImageResponseOptions extends StructuredResponseOptions {
	imageDataUrl: string;
	imageDetail?: ImageDetailLevel;
}

export type ImageDetailLevel = 'low' | 'high' | 'auto';

interface StructuredImagesResponseOptions extends StructuredResponseOptions {
	imageDataUrls: string[];
	/** Vision detail for input_image parts (Responses API). Defaults to API auto when omitted. */
	imageDetail?: ImageDetailLevel;
}

async function postOpenAiStructured(
	apiKey: string,
	input: unknown[],
	schemaName: string,
	schema: Record<string, unknown>,
	strict = true,
	model = OPENAI_MODEL
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
				model,
				input,
				text: {
					format: {
						type: 'json_schema',
						name: schemaName,
						strict,
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
			messageKey: OPENAI_NETWORK_ERROR_KEY,
			logDetail: `OpenAI request failed: ${detail}`
		};
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		return {
			ok: false,
			status: mapOpenAiFailureStatus(response.status),
			messageKey: openAiFailureMessageKey(response.status),
			logDetail: errorText.trim().slice(0, 300) || String(response.status)
		};
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		return {
			ok: false,
			status: 502,
			messageKey: OPENAI_UNREADABLE_RESPONSE_KEY
		};
	}

	const outputText = extractResponseOutputText(payload);
	if (!outputText.trim()) {
		return {
			ok: false,
			status: 422,
			messageKey: OPENAI_EMPTY_RESPONSE_KEY
		};
	}

	const data = safeParseModelJson(outputText);
	if (data === null) {
		return {
			ok: false,
			status: 422,
			messageKey: OPENAI_INVALID_JSON_KEY
		};
	}

	return { ok: true, data };
}

function trackOpenAiResult(result: StructuredJsonResult): StructuredJsonResult {
	if (result.ok) {
		recordOpenAiSuccess();
	} else {
		recordOpenAiFailure();
	}
	return result;
}

export async function requestStructuredJson(
	apiKey: string,
	options: StructuredResponseOptions
): Promise<StructuredJsonResult> {
	return trackOpenAiResult(
		await postOpenAiStructured(
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
			options.schema,
			options.strict ?? true,
			options.model
		)
	);
}

export async function requestStructuredJsonFromImage(
	apiKey: string,
	options: StructuredImageResponseOptions
): Promise<StructuredJsonResult> {
	return requestStructuredJsonFromImages(apiKey, {
		systemPrompt: options.systemPrompt,
		userPrompt: options.userPrompt,
		schemaName: options.schemaName,
		schema: options.schema,
		strict: options.strict,
		imageDataUrls: [options.imageDataUrl],
		imageDetail: options.imageDetail
	});
}

export async function requestStructuredJsonFromImages(
	apiKey: string,
	options: StructuredImagesResponseOptions
): Promise<StructuredJsonResult> {
	const imageParts = options.imageDataUrls.map((imageDataUrl) => ({
		type: 'input_image' as const,
		image_url: imageDataUrl,
		...(options.imageDetail ? { detail: options.imageDetail } : {})
	}));

	return trackOpenAiResult(
		await postOpenAiStructured(
			apiKey,
			[
				{
					role: 'system',
					content: [{ type: 'input_text', text: options.systemPrompt }]
				},
				{
					role: 'user',
					content: [{ type: 'input_text', text: options.userPrompt }, ...imageParts]
				}
			],
			options.schemaName,
			options.schema,
			options.strict ?? true,
			options.model
		)
	);
}

