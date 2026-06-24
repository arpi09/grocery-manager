import type { InventoryItem } from '$lib/domain/inventory-item';
import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import type { StorageLocation } from '$lib/domain/location';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { shelfLifeEstimateToExpiresOnSource } from '$lib/domain/shelf-life-estimate';
import {
	buildStandardJsonUserBlock,
	estimateInputTokens,
	PROMPT_VERSION_SHELF_LIFE_BATCH,
	promptLocaleTag,
	SHELF_LIFE_CATEGORY_ANCHORS
} from '$lib/server/ai-prompt-shared';
import { isReceiptAiBatchEnabled } from '$lib/server/feature-flags';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import { isOpenAiDegradedMode } from '$lib/server/openai-circuit-breaker';
import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { RECEIPT_SHELF_LIFE_BATCH_SCHEMA, SHELF_LIFE_BATCH_SYSTEM_PROMPT } from '$lib/server/receipt-shelf-life-predictions';

export const MISSING_EXPIRY_BATCH_MAX = 40;

export interface MissingExpiryBatchEstimate {
	itemId: string;
	expiresOn: string;
	estimatedDays: number;
}

function buildMissingExpiryBatchUserPrompt(
	items: Array<{ index: number; name: string; location: StorageLocation }>,
	todayIso: string,
	feedback?: { priorCorrectionsBlock?: string; globalFewShotBlock?: string }
): string {
	return buildStandardJsonUserBlock(
		{
			version: `${PROMPT_VERSION_SHELF_LIFE_BATCH}-missing-expiry`,
			locale: promptLocaleTag('sv')
		},
		{
			instruction:
				'Uppskatta hållbarhet (estimatedDays) för aktiva varor utan bäst-före-datum. Använd location som förvaring.',
			metadata: JSON.stringify({
				todayIso,
				lines: items.map((item) => ({
					index: item.index,
					name: item.name,
					location: item.location,
					opened: false
				}))
			}),
			priorCorrections: feedback?.priorCorrectionsBlock ?? null,
			globalFewShot: feedback?.globalFewShotBlock ?? null
		}
	);
}

export async function inferMissingExpiryBatch(
	apiKey: string,
	items: InventoryItem[],
	options: {
		todayIso?: string;
		priorCorrectionsBlock?: string;
		globalFewShotBlock?: string;
	} = {}
): Promise<MissingExpiryBatchEstimate[]> {
	if (!isReceiptAiBatchEnabled() || isOpenAiDegradedMode() || items.length === 0) {
		return [];
	}

	const todayIso = options.todayIso ?? formatTodayIso();
	const batch = items.slice(0, MISSING_EXPIRY_BATCH_MAX).map((item, index) => ({
		index,
		itemId: item.id,
		name: item.name,
		location: item.location
	}));

	const userPrompt = buildMissingExpiryBatchUserPrompt(batch, todayIso, {
		priorCorrectionsBlock: options.priorCorrectionsBlock,
		globalFewShotBlock: options.globalFewShotBlock
	});
	const result = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt: [
			SHELF_LIFE_BATCH_SYSTEM_PROMPT,
			'Batch för varor utan expiresOn i skafferiet — var försiktig, lägre confidence vid osäkerhet.',
			SHELF_LIFE_CATEGORY_ANCHORS
		].join('\n'),
		userPrompt,
		schemaName: 'missing_expiry_batch',
		schema: RECEIPT_SHELF_LIFE_BATCH_SCHEMA
	});

	if (!result.ok) {
		return [];
	}

	logBrainMetrics('missing_expiry_batch', {
		source: 'missing_expiry_batch',
		receiptParseLineCount: batch.length,
		aiBatchUsed: true,
		promptVersion: `${PROMPT_VERSION_SHELF_LIFE_BATCH}-missing-expiry`,
		inputTokenEstimate: estimateInputTokens(userPrompt, batch.length)
	});

	const estimates = (result.data as { estimates?: unknown }).estimates;
	if (!Array.isArray(estimates)) return [];

	const byIndex = new Map(batch.map((row) => [row.index, row]));
	const output: MissingExpiryBatchEstimate[] = [];

	for (const entry of estimates) {
		if (!entry || typeof entry !== 'object') continue;
		const row = entry as Record<string, unknown>;
		const index = typeof row.index === 'number' ? row.index : null;
		const estimatedDays =
			typeof row.estimatedDays === 'number' && row.estimatedDays > 0
				? Math.round(row.estimatedDays)
				: null;
		if (index === null || estimatedDays === null || !byIndex.has(index)) continue;

		const source = byIndex.get(index)!;
		output.push({
			itemId: source.itemId,
			expiresOn: computeExpiresOn(estimatedDays, null, todayIso),
			estimatedDays
		});
	}

	return output;
}

export function missingExpiryBatchToUpdates(
	estimates: MissingExpiryBatchEstimate[]
): Array<{ id: string; expiresOn: string; expiresOnSource: ExpiresOnSource }> {
	return estimates.map((entry) => ({
		id: entry.itemId,
		expiresOn: entry.expiresOn,
		expiresOnSource: shelfLifeEstimateToExpiresOnSource('ai_inferred')
	}));
}
