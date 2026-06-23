import {
	PROMPT_VERSION_EXPIRY_PUSH,
	PROMPT_VERSION_INSIGHTS,
	PROMPT_VERSION_MERGE,
	PROMPT_VERSION_PHOTO_ROUND,
	PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	PROMPT_VERSION_RECEIPT_PARSE,
	PROMPT_VERSION_RECIPE,
	PROMPT_VERSION_SHELF_LIFE_BATCH,
	PROMPT_VERSION_SHOPPING
} from '$lib/server/ai-prompt-shared';

/** Lightweight registry of active prompt versions per AI surface. */
export const AI_PROMPT_REGISTRY = {
	'receipt-parse': PROMPT_VERSION_RECEIPT_PARSE,
	'shelf-life-batch': PROMPT_VERSION_SHELF_LIFE_BATCH,
	'photo-round': PROMPT_VERSION_PHOTO_ROUND,
	'product-from-image': PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	recipe: PROMPT_VERSION_RECIPE,
	insights: PROMPT_VERSION_INSIGHTS,
	shopping: PROMPT_VERSION_SHOPPING,
	merge: PROMPT_VERSION_MERGE,
	'expiry-push': PROMPT_VERSION_EXPIRY_PUSH
} as const;

export type AiPromptSurface = keyof typeof AI_PROMPT_REGISTRY;

export function getPromptVersion(surface: AiPromptSurface): string {
	return AI_PROMPT_REGISTRY[surface];
}

export function getPrompt(surface: AiPromptSurface, version?: string): string {
	const active = AI_PROMPT_REGISTRY[surface];
	if (version != null && version !== active) {
		console.warn(`[ai-prompts] ${surface} requested version ${version} but active is ${active}`);
	}
	return active;
}
