import type { InventoryItem } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';
import type { PhotoRoundDetectedItem } from '$lib/domain/photo-round';
import {
	PROMPT_VERSION_EXPIRY_PUSH,
	PROMPT_VERSION_INSIGHTS,
	PROMPT_VERSION_MERGE,
	PROMPT_VERSION_PHOTO_ROUND,
	PROMPT_VERSION_PANTRY_DELTA,
	PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	PROMPT_VERSION_RECEIPT_PARSE,
	PROMPT_VERSION_RECIPE,
	PROMPT_VERSION_RECIPE_COOK,
	PROMPT_VERSION_SHELF_LIFE_BATCH,
	PROMPT_VERSION_SHOPPING,
	PROMPT_VERSION_WEEKLY_PLAN
} from '$lib/server/ai-prompt-shared';
import {
	buildInventoryInsightsSystemPrompt,
	buildInventoryInsightsUserPrompt
} from '$lib/server/inventory-insights';
import {
	buildPhotoRoundUserPrompt,
	photoRoundSystemPrompt,
	PHOTO_ROUND_VALIDATION_PROMPT
} from '$lib/server/photo-round-parse';
import {
	buildProductFromImageSystemPrompt,
	buildProductFromImageUserPrompt
} from '$lib/server/product-from-image-prompt';
import { buildRecipeSystemPrompt, buildRecipeUserPrompt, type RecipeUserPromptContext } from '$lib/server/recipe-prompt';
import {
	buildRecipeCookSystemPrompt,
	buildRecipeCookUserPrompt,
	type RecipeCookPromptInput
} from '$lib/server/recipe-cook-prompt';
import { SHELF_LIFE_BATCH_SYSTEM_PROMPT } from '$lib/server/receipt-shelf-life-predictions';

/** Lightweight registry of active prompt versions per AI surface. */
export const AI_PROMPT_REGISTRY = {
	'receipt-parse': PROMPT_VERSION_RECEIPT_PARSE,
	'shelf-life-batch': PROMPT_VERSION_SHELF_LIFE_BATCH,
	'photo-round': PROMPT_VERSION_PHOTO_ROUND,
	'pantry-delta': PROMPT_VERSION_PANTRY_DELTA,
	'product-from-image': PROMPT_VERSION_PRODUCT_FROM_IMAGE,
	recipe: PROMPT_VERSION_RECIPE,
	'recipe-cook': PROMPT_VERSION_RECIPE_COOK,
	insights: PROMPT_VERSION_INSIGHTS,
	shopping: PROMPT_VERSION_SHOPPING,
	merge: PROMPT_VERSION_MERGE,
	'expiry-push': PROMPT_VERSION_EXPIRY_PUSH,
	'weekly-plan': PROMPT_VERSION_WEEKLY_PLAN
} as const;

export type AiPromptSurface = keyof typeof AI_PROMPT_REGISTRY;

export interface PromptPayload {
	version: string;
	systemPrompt: string;
	userPrompt: string;
}

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

export function buildPhotoRoundPrompts(
	zoneHint: StorageLocation | null,
	imageCount: number,
	alreadyDetected: PhotoRoundDetectedItem[] = []
): PromptPayload {
	return {
		version: PROMPT_VERSION_PHOTO_ROUND,
		systemPrompt: photoRoundSystemPrompt(zoneHint),
		userPrompt: buildPhotoRoundUserPrompt(zoneHint, imageCount, alreadyDetected)
	};
}

export function buildProductFromImagePrompts(
	locale: string,
	locationHint: StorageLocation | null = null
): PromptPayload {
	return {
		version: PROMPT_VERSION_PRODUCT_FROM_IMAGE,
		systemPrompt: buildProductFromImageSystemPrompt(locale),
		userPrompt: buildProductFromImageUserPrompt(locale, locationHint)
	};
}

export function buildInventoryInsightsPrompts(items: InventoryItem[], locale: string): PromptPayload {
	return {
		version: PROMPT_VERSION_INSIGHTS,
		systemPrompt: buildInventoryInsightsSystemPrompt(locale),
		userPrompt: buildInventoryInsightsUserPrompt(items, locale)
	};
}

export function buildRecipePrompts(context: RecipeUserPromptContext): PromptPayload {
	return {
		version: PROMPT_VERSION_RECIPE,
		systemPrompt: buildRecipeSystemPrompt(context.portions, context.locale),
		userPrompt: buildRecipeUserPrompt(context)
	};
}

export function buildRecipeCookPrompts(
	input: RecipeCookPromptInput,
	inventory: InventoryItem[]
): PromptPayload {
	const locale = input.locale === 'en' ? 'en' : 'sv';
	return {
		version: PROMPT_VERSION_RECIPE_COOK,
		systemPrompt: buildRecipeCookSystemPrompt(locale),
		userPrompt: buildRecipeCookUserPrompt(input, inventory)
	};
}

export function buildWeeklyPlanPromptSnapshot(): Pick<PromptPayload, 'version' | 'systemPrompt'> {
	return {
		version: PROMPT_VERSION_WEEKLY_PLAN,
		systemPrompt: `Orchestrator ${PROMPT_VERSION_WEEKLY_PLAN}: composes ${PROMPT_VERSION_RECIPE} + ${PROMPT_VERSION_SHOPPING} with meal slot assignment.`
	};
}

export function buildShelfLifeBatchPromptSnapshot(): Pick<PromptPayload, 'version' | 'systemPrompt'> {
	return {
		version: PROMPT_VERSION_SHELF_LIFE_BATCH,
		systemPrompt: SHELF_LIFE_BATCH_SYSTEM_PROMPT
	};
}

export function buildPhotoRoundValidationPromptSnapshot(): Pick<PromptPayload, 'version' | 'systemPrompt'> {
	return {
		version: PROMPT_VERSION_PHOTO_ROUND,
		systemPrompt: PHOTO_ROUND_VALIDATION_PROMPT
	};
}

export function buildPrompt(
	surface: AiPromptSurface,
	args: unknown
): PromptPayload | Pick<PromptPayload, 'version' | 'systemPrompt'> {
	switch (surface) {
		case 'photo-round':
			return buildPhotoRoundPrompts(
				(args as { zoneHint: StorageLocation | null; imageCount: number }).zoneHint,
				(args as { imageCount: number }).imageCount,
				(args as { alreadyDetected?: PhotoRoundDetectedItem[] }).alreadyDetected
			);
		case 'product-from-image':
			return buildProductFromImagePrompts(
				(args as { locale: string }).locale,
				(args as { locationHint?: StorageLocation | null }).locationHint ?? null
			);
		case 'insights':
			return buildInventoryInsightsPrompts(
				(args as { items: InventoryItem[] }).items,
				(args as { locale: string }).locale
			);
		case 'recipe':
			return buildRecipePrompts(args as RecipeUserPromptContext);
		case 'recipe-cook':
			return buildRecipeCookPrompts(
				(args as { input: RecipeCookPromptInput }).input,
				(args as { inventory: InventoryItem[] }).inventory
			);
		case 'weekly-plan':
			return buildWeeklyPlanPromptSnapshot();
		case 'shelf-life-batch':
			return buildShelfLifeBatchPromptSnapshot();
		default:
			return { version: getPromptVersion(surface), systemPrompt: '', userPrompt: '' };
	}
}
