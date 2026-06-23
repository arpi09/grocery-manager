import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { isOpenAiDegradedMode } from '$lib/server/openai-circuit-breaker';
import {
	normalizePromptLocale,
	PROMPT_VERSION_EXPIRY_PUSH,
	promptLocaleInstruction,
	promptLocaleTag
} from '$lib/server/ai-prompt-shared';

export const EXPIRY_PUSH_MAX_ITEMS = 3;

export const EXPIRY_PUSH_BODY_SCHEMA = {
	type: 'object',
	properties: {
		body: { type: 'string' }
	},
	required: ['body'],
	additionalProperties: false
} as const;

export const EXPIRY_PUSH_SYSTEM_PROMPT = [
	'Du skriver en kort push-notis om mat som snart går ut i ett svenskt hushåll.',
	'Max 120 tecken, vardaglig svenska, inga emojis.',
	'Nämn 1–2 varor och uppmuntra att äta eller planera recept.',
	`promptVersion: ${PROMPT_VERSION_EXPIRY_PUSH}`
].join('\n');

export interface ExpiryPushItem {
	name: string;
	daysUntil: number;
}

export function buildExpiryPushUserPrompt(
	items: ExpiryPushItem[],
	locale = 'sv'
): string {
	const promptLocale = normalizePromptLocale(locale);
	return JSON.stringify({
		promptVersion: PROMPT_VERSION_EXPIRY_PUSH,
		locale: promptLocaleTag(promptLocale),
		instruction: promptLocaleInstruction(promptLocale),
		items: items.slice(0, EXPIRY_PUSH_MAX_ITEMS),
		daysUntilMin: items.length > 0 ? Math.min(...items.map((item) => item.daysUntil)) : 0,
		model: OPENAI_MODEL_NANO
	});
}

export async function generateExpiryPushBody(
	apiKey: string,
	items: ExpiryPushItem[],
	locale = 'sv'
): Promise<string | null> {
	if (items.length === 0 || isOpenAiDegradedMode()) {
		return null;
	}

	const result = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt: EXPIRY_PUSH_SYSTEM_PROMPT,
		userPrompt: buildExpiryPushUserPrompt(items, locale),
		schemaName: 'expiry_push_body',
		schema: EXPIRY_PUSH_BODY_SCHEMA
	});

	if (!result.ok) {
		return null;
	}

	const body = (result.data as { body?: unknown }).body;
	if (typeof body !== 'string') {
		return null;
	}
	const trimmed = body.trim();
	return trimmed ? trimmed.slice(0, 120) : null;
}

/** @deprecated Use structured items array */
export function buildExpiryPushUserPromptLegacy(itemNames: string[], daysUntil: number): string {
	return buildExpiryPushUserPrompt(
		itemNames.slice(0, 3).map((name) => ({ name, daysUntil })),
		'sv'
	);
}
