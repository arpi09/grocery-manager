import { OPENAI_MODEL_NANO } from '$lib/server/openai';
import {
	normalizePromptLocale,
	PROMPT_VERSION_EXPIRY_PUSH,
	promptLocaleInstruction,
	promptLocaleTag
} from '$lib/server/ai-prompt-shared';

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
		items: items.slice(0, 5),
		daysUntilMin: items.length > 0 ? Math.min(...items.map((item) => item.daysUntil)) : 0,
		model: OPENAI_MODEL_NANO
	});
}

/** @deprecated Use structured items array */
export function buildExpiryPushUserPromptLegacy(itemNames: string[], daysUntil: number): string {
	return buildExpiryPushUserPrompt(
		itemNames.slice(0, 3).map((name) => ({ name, daysUntil })),
		'sv'
	);
}
