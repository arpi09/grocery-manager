import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import type { StorageLocation } from '$lib/domain/location';
import {
	PROMPT_VERSION_MERGE,
	promptLocaleInstruction
} from '$lib/server/ai-prompt-shared';

const MERGE_CONFIRM_SCHEMA = {
	type: 'object',
	properties: {
		sameProduct: { type: 'boolean' }
	},
	required: ['sameProduct'],
	additionalProperties: false
} as const;

export interface MergeProductContext {
	categoryHint?: string | null;
	location?: StorageLocation | null;
}

/** Nano merge confirmation for Jaccard 0.5–0.7 fuzzy band (below auto-merge threshold). */
export async function confirmSameProductMerge(
	apiKey: string,
	leftName: string,
	rightName: string,
	context: MergeProductContext = {}
): Promise<boolean | null> {
	const locale = 'sv';
	const contextLines: string[] = [];
	if (context.location) {
		contextLines.push(`Förvaring A: ${context.location}`);
	}
	if (context.categoryHint?.trim()) {
		contextLines.push(`Kategori A: ${context.categoryHint.trim()}`);
	}

	const result = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt: [
			'Du avgör om två skafferinamn är samma livsmedelsprodukt i ett svenskt hushåll.',
			'Ignorera varumärke, storlek och stavfel om produkten är uppenbart samma.',
			promptLocaleInstruction(locale),
			`promptVersion: ${PROMPT_VERSION_MERGE}`,
			'Returnera JSON: {"sameProduct": true|false}'
		].join('\n'),
		userPrompt: [`Namn A: ${leftName}`, `Namn B: ${rightName}`, ...contextLines].join('\n'),
		schemaName: 'inventory_merge_confirm',
		schema: MERGE_CONFIRM_SCHEMA
	});

	if (!result.ok) return null;
	const sameProduct = (result.data as { sameProduct?: unknown }).sameProduct;
	return typeof sameProduct === 'boolean' ? sameProduct : null;
}
