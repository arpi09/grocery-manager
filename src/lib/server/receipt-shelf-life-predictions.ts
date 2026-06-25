import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import { buildShelfLifeExplanationFromSource } from '$lib/domain/learning/prediction-explain';
import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
import { extractPrintedBbfForProductLine } from '$lib/domain/receipt-printed-bbf';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { guessDaysFromCategoryHint } from '$lib/domain/shelf-life-global-categories';
import { needsShelfLifeLlmRefinement } from '$lib/domain/shelf-life-confidence';
import { shelfLifeEstimateToExpiresOnSource } from '$lib/domain/shelf-life-estimate';
import { DEFAULT_LOCALE } from '$lib/i18n/locale';
import {
	buildStandardJsonUserBlock,
	estimateInputTokens,
	PROMPT_VERSION_SHELF_LIFE_BATCH,
	promptLocaleTag,
	SHELF_LIFE_CATEGORY_ANCHORS
} from '$lib/server/ai-prompt-shared';
import { isReceiptAiBatchEnabled } from '$lib/server/feature-flags';
import { isGlobalShelfLifeDbEnabled } from '$lib/server/feature-flags';
import { predictHeuristicShelfLife } from '$lib/infrastructure/adapters/heuristic-shelf-life.adapter';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { OPENAI_MODEL_NANO, requestStructuredJson } from '$lib/server/openai';
import { RECEIPT_BBF_FEW_SHOT_BLOCK } from '$lib/server/receipt-bbf-few-shot';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import type { StorageLocation } from '$lib/domain/location';

const SHELF_LIFE_BATCH_MAX_LINES = 40;
const HEURISTIC_AI_SKIP_TOLERANCE = 0.2;
const HIGH_CONFIDENCE_SKIP_THRESHOLD = 0.8;

/** Per-parse session cache — avoids duplicate OpenAI batch calls for same normalizedKey. */
const sessionAiCache = new Map<string, { estimatedDays: number; confidence: number }>();

export const RECEIPT_SHELF_LIFE_BATCH_SCHEMA = {
	type: 'object',
	properties: {
		estimates: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					index: { type: 'number' },
					estimatedDays: { type: 'number' },
					confidence: { type: 'number' }
				},
				required: ['index', 'estimatedDays', 'confidence'],
				additionalProperties: false
			}
		}
	},
	required: ['estimates'],
	additionalProperties: false
} as const;

export const SHELF_LIFE_BATCH_SYSTEM_PROMPT = [
	'Du uppskattar hållbarhet i dagar för svenska livsmedel efter inköp.',
	'Regler:',
	'- estimatedDays: heltal, antal dagar från inköpsdatum tills varan typiskt håller',
	'- confidence: 0.2–0.9 (lägre när osäker)',
	'- estimatedDays från inköp; freezer förlänger kraftigt för glass/fryst',
	'- brand + categoryHint + packageSize är obligatoriska signaler när de finns',
	'- Homogenisera inte — mjölk ≠ glass ≠ ris',
	'- fridge: kortare, freezer: längre, cupboard: medellång',
	'- Använd brand, packageSize, categoryHint, quantity, unit och storeLabel när de finns',
	'- householdRule: hushållsspecifik inlärning — justera bara vid låg confidence',
	'- globalHint: global kategoridata — använd som ankare, inte som hårt krav',
	SHELF_LIFE_CATEGORY_ANCHORS,
	RECEIPT_BBF_FEW_SHOT_BLOCK,
	`- promptVersion: ${PROMPT_VERSION_SHELF_LIFE_BATCH}`,
	'- max 40 rader'
].join('\n');

export interface PredictReceiptLinesShelfLifeOptions {
	apiKey?: string;
	todayIso?: string;
	storeLabel?: string | null;
	receiptText?: string | null;
	shelfLifeRules?: IHouseholdShelfLifeRuleRepository;
	priorCorrectionsBlock?: string;
	globalFewShotBlock?: string;
	/** Clear session AI cache (e.g. new upload). */
	clearCache?: boolean;
}

export interface ShelfLifeSingleLlmInput {
	name: string;
	location: StorageLocation;
	brand?: string | null;
	packageSize?: string | null;
	categoryHint?: string | null;
	purchasedAt?: string | null;
	storeLabel?: string | null;
}

export interface ShelfLifeSingleLlmResult {
	expiresOn: string;
	typicalDays: number;
	confidence: number;
}

function cacheKey(normalizedKey: string, location: string): string {
	return `${normalizedKey}:${location}`;
}

function heuristicPredictionFromLine(
	line: ReceiptLine,
	purchasedAt: string | null,
	todayIso: string
): ReceiptShelfLifePrediction | null {
	const heuristic = predictHeuristicShelfLife({
		productName: line.name,
		location: line.location,
		purchasedAt,
		todayIso,
		categoryHint: line.categoryHint ?? null,
		openedPackage: false
	});
	if (!heuristic) return null;

	const normalizedKey = normalizeReceiptProductName(line.name);
	const explanation = buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {
		source: heuristic.source,
		typicalDays: heuristic.typicalDays,
		location: line.location,
		purchasedAt,
		displayName: line.name,
		normalizedKey
	});

	return {
		expiresOn: heuristic.expiresOn,
		typicalDays: heuristic.typicalDays,
		expiresOnSource: heuristic.source,
		confidence: 0.55,
		modelVersion: 'receipt-shelf-life-heuristic-v1',
		explanation: explanation ?? undefined
	};
}

function aiEstimateWithinHeuristicTolerance(aiDays: number, heuristicDays: number): boolean {
	const delta = Math.abs(aiDays - heuristicDays) / Math.max(heuristicDays, 1);
	return delta <= HEURISTIC_AI_SKIP_TOLERANCE;
}

function shouldSkipAiForHighConfidenceHeuristic(line: ReceiptLine, heuristicDays: number): boolean {
	if ((line.confidence ?? 0) < HIGH_CONFIDENCE_SKIP_THRESHOLD) return false;
	if (!line.categoryHint?.trim()) return false;
	const anchorDays = guessDaysFromCategoryHint(line.categoryHint, line.location);
	if (anchorDays == null) return false;
	const delta = Math.abs(heuristicDays - anchorDays) / Math.max(anchorDays, 1);
	return delta <= HEURISTIC_AI_SKIP_TOLERANCE;
}

function applyPrintedExpiresOnLine(
	line: ReceiptLine,
	purchasedAt: string | null,
	todayIso: string
): ReceiptShelfLifePrediction | null {
	const printed = line.printedExpiresOn?.trim();
	if (!printed || !/^\d{4}-\d{2}-\d{2}$/.test(printed)) return null;

	const base = purchasedAt ?? todayIso;
	const typicalDays = Math.max(
		1,
		Math.round(
			(new Date(`${printed}T12:00:00`).getTime() - new Date(`${base}T12:00:00`).getTime()) /
				(1000 * 60 * 60 * 24)
		)
	);
	const normalizedKey = normalizeReceiptProductName(line.name);
	const explanation = buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {
		source: 'receipt_printed',
		typicalDays,
		location: line.location,
		purchasedAt,
		displayName: line.name,
		normalizedKey
	});

	return {
		expiresOn: printed,
		typicalDays,
		expiresOnSource: 'receipt_printed',
		confidence: 0.92,
		modelVersion: 'receipt-printed-bbf-v1',
		explanation: explanation ?? undefined
	};
}

function applyPrintedBbf(
	line: ReceiptLine,
	receiptText: string | null,
	purchasedAt: string | null,
	todayIso: string
): ReceiptShelfLifePrediction | null {
	const fromLine = applyPrintedExpiresOnLine(line, purchasedAt, todayIso);
	if (fromLine) return fromLine;
	if (!receiptText) return null;
	const printed = extractPrintedBbfForProductLine(receiptText, line.name);
	if (!printed) return null;

	const base = purchasedAt ?? todayIso;
	const typicalDays = Math.max(
		1,
		Math.round(
			(new Date(`${printed}T12:00:00`).getTime() - new Date(`${base}T12:00:00`).getTime()) /
				(1000 * 60 * 60 * 24)
		)
	);
	const normalizedKey = normalizeReceiptProductName(line.name);
	const explanation = buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {
		source: 'receipt_printed',
		typicalDays,
		location: line.location,
		purchasedAt,
		displayName: line.name,
		normalizedKey
	});

	return {
		expiresOn: printed,
		typicalDays,
		expiresOnSource: 'receipt_printed',
		confidence: 0.92,
		modelVersion: 'receipt-printed-bbf-v1',
		explanation: explanation ?? undefined
	};
}

function shouldSkipAiForResolvedLine(line: ReceiptLine): boolean {
	return Boolean(line.printedExpiresOn?.trim());
}

interface ShelfLifeAiBatchOptions {
	priorCorrectionsBlock?: string;
	globalFewShotBlock?: string;
}

async function predictShelfLifeAiBatch(
	apiKey: string,
	indices: number[],
	lines: ReceiptLine[],
	purchasedAt: string | null,
	storeLabel: string | null,
	todayIso: string,
	alreadyResolved: Array<{ index: number; expiresOn: string; source: string }>,
	householdId: string,
	shelfLifeRules?: IHouseholdShelfLifeRuleRepository,
	feedback?: ShelfLifeAiBatchOptions
): Promise<Map<number, { estimatedDays: number; confidence: number }>> {
	const result = new Map<number, { estimatedDays: number; confidence: number }>();
	if (indices.length === 0) return result;

	const uncachedIndices: number[] = [];
	for (const index of indices.slice(0, SHELF_LIFE_BATCH_MAX_LINES)) {
		const line = lines[index];
		if (shouldSkipAiForResolvedLine(line)) {
			continue;
		}

		const key = cacheKey(normalizeReceiptProductName(line.name), line.location);
		const cached = sessionAiCache.get(key);
		if (cached) {
			result.set(index, cached);
			continue;
		}

		const heuristic = predictHeuristicShelfLife({
			productName: line.name,
			location: line.location,
			purchasedAt,
			todayIso,
			categoryHint: line.categoryHint ?? null
		});
		if (heuristic && shouldSkipAiForHighConfidenceHeuristic(line, heuristic.typicalDays)) {
			const estimate = { estimatedDays: heuristic.typicalDays, confidence: 0.75 };
			result.set(index, estimate);
			sessionAiCache.set(key, estimate);
			continue;
		}

		uncachedIndices.push(index);
	}

	if (uncachedIndices.length === 0) return result;

	const payload = await Promise.all(
		uncachedIndices.map(async (index) => {
			const line = lines[index];
			const normalizedKey = normalizeReceiptProductName(line.name);
			const householdRule = shelfLifeRules
				? await shelfLifeRules.findByKey(householdId, normalizedKey, line.location)
				: null;
			const globalHint =
				isGlobalShelfLifeDbEnabled() && line.categoryHint
					? guessDaysFromCategoryHint(line.categoryHint, line.location)
					: null;

			return {
				index,
				name: line.name,
				location: line.location,
				brand: line.brand ?? null,
				packageSize: line.packageSize ?? null,
				categoryHint: line.categoryHint ?? null,
				quantity: line.quantity ?? null,
				unit: line.unit ?? null,
				opened: false,
				storageTemp: line.location,
				storeLabel,
				householdRule: householdRule
					? { typicalDays: householdRule.typicalDays, sampleCount: householdRule.sampleCount }
					: null,
				globalHint
			};
		})
	);

	const userPrompt = buildStandardJsonUserBlock(
		{
			version: PROMPT_VERSION_SHELF_LIFE_BATCH,
			locale: promptLocaleTag(DEFAULT_LOCALE),
			purchasedAt
		},
		{
			instruction:
				'Uppskatta hållbarhet (estimatedDays) för raderna i lines. alreadyResolved är redan lösta — räkna inte om dem.',
			metadata: JSON.stringify({
				purchasedAt,
				storeLabel,
				lines: payload,
				alreadyResolved
			}),
			priorCorrections: feedback?.priorCorrectionsBlock ?? null,
			globalFewShot: feedback?.globalFewShotBlock ?? null
		}
	);

	const aiResult = await requestStructuredJson(apiKey, {
		model: OPENAI_MODEL_NANO,
		systemPrompt: SHELF_LIFE_BATCH_SYSTEM_PROMPT,
		userPrompt,
		schemaName: 'receipt_shelf_life_batch',
		schema: RECEIPT_SHELF_LIFE_BATCH_SCHEMA
	});

	if (!aiResult.ok) {
		console.warn('[receipt] Shelf-life AI batch failed:', aiResult.status);
		return result;
	}

	logBrainMetrics('shelf_life_batch', {
		source: 'receipt_shelf_life',
		receiptParseLineCount: uncachedIndices.length,
		aiBatchUsed: true,
		wasGptInvoked: true,
		promptVersion: PROMPT_VERSION_SHELF_LIFE_BATCH,
		inputTokenEstimate: estimateInputTokens(userPrompt, uncachedIndices.length)
	});

	const estimates = (aiResult.data as { estimates?: unknown }).estimates;
	if (!Array.isArray(estimates)) return result;

	for (const entry of estimates) {
		if (!entry || typeof entry !== 'object') continue;
		const row = entry as Record<string, unknown>;
		const index = typeof row.index === 'number' ? row.index : null;
		const estimatedDays =
			typeof row.estimatedDays === 'number' && row.estimatedDays > 0
				? Math.round(row.estimatedDays)
				: null;
		const confidence =
			typeof row.confidence === 'number' && row.confidence > 0
				? Math.min(0.9, Math.max(0.2, row.confidence))
				: 0.45;
		if (index === null || estimatedDays === null || !uncachedIndices.includes(index)) continue;

		const line = lines[index];
		const heuristic = predictHeuristicShelfLife({
			productName: line.name,
			location: line.location,
			purchasedAt,
			todayIso,
			categoryHint: line.categoryHint ?? null
		});
		if (heuristic && aiEstimateWithinHeuristicTolerance(estimatedDays, heuristic.typicalDays)) {
			const estimate = { estimatedDays: heuristic.typicalDays, confidence: 0.5 };
			result.set(index, estimate);
			sessionAiCache.set(cacheKey(normalizeReceiptProductName(line.name), line.location), estimate);
			continue;
		}

		const estimate = { estimatedDays, confidence };
		result.set(index, estimate);
		sessionAiCache.set(cacheKey(normalizeReceiptProductName(line.name), line.location), estimate);
	}

	return result;
}

function buildPredictionFromAiEstimate(
	line: ReceiptLine,
	aiEstimate: { estimatedDays: number; confidence: number },
	purchasedAt: string | null,
	todayIso: string
): ReceiptShelfLifePrediction {
	const expiresOn = computeExpiresOn(aiEstimate.estimatedDays, purchasedAt, todayIso);
	const expiresOnSource = shelfLifeEstimateToExpiresOnSource('ai_inferred');
	const explanation = buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {
		source: expiresOnSource,
		typicalDays: aiEstimate.estimatedDays,
		location: line.location,
		purchasedAt,
		displayName: line.name,
		normalizedKey: normalizeReceiptProductName(line.name)
	});

	return {
		expiresOn,
		typicalDays: aiEstimate.estimatedDays,
		expiresOnSource,
		confidence: aiEstimate.confidence,
		modelVersion: 'receipt-shelf-life-ai-v1',
		explanation: explanation ?? undefined
	};
}

/** Single-line GPT shelf-life inference (scan/add-item fallback). */
export async function inferShelfLifeSingleLlm(
	apiKey: string,
	input: ShelfLifeSingleLlmInput,
	options: { todayIso?: string; feedback?: ShelfLifeAiBatchOptions } = {}
): Promise<ShelfLifeSingleLlmResult | null> {
	const todayIso = options.todayIso ?? formatTodayIso();
	const syntheticLine: ReceiptLine = {
		name: input.name,
		location: input.location,
		brand: input.brand ?? null,
		packageSize: input.packageSize ?? null,
		categoryHint: input.categoryHint ?? null
	};

	const estimates = await predictShelfLifeAiBatch(
		apiKey,
		[0],
		[syntheticLine],
		input.purchasedAt ?? null,
		input.storeLabel ?? null,
		todayIso,
		[],
		'',
		undefined,
		options.feedback
	);
	const estimate = estimates.get(0);
	if (!estimate) return null;

	return {
		expiresOn: computeExpiresOn(estimate.estimatedDays, input.purchasedAt ?? null, todayIso),
		typicalDays: estimate.estimatedDays,
		confidence: estimate.confidence
	};
}

export async function predictReceiptLinesShelfLife(
	householdId: string,
	lines: ReceiptLine[],
	purchasedAt: string | null,
	learningEngine: LearningEngineService,
	options: PredictReceiptLinesShelfLifeOptions = {}
): Promise<(ReceiptShelfLifePrediction | null)[]> {
	if (options.clearCache) {
		sessionAiCache.clear();
	}

	const todayIso = options.todayIso ?? formatTodayIso();
	const receiptText = options.receiptText ?? null;
	const storeLabel = options.storeLabel ?? null;
	const feedback = {
		priorCorrectionsBlock: options.priorCorrectionsBlock,
		globalFewShotBlock: options.globalFewShotBlock
	};

	const predictions = await Promise.all(
		lines.map(async (line) => {
			const printed = applyPrintedBbf(line, receiptText, purchasedAt, todayIso);
			if (printed) return printed;

			const normalizedKey = normalizeReceiptProductName(line.name);
			if (!normalizedKey) return null;

			const prediction = await learningEngine.predictShelfLife(householdId, {
				productName: line.name,
				normalizedKey,
				location: line.location,
				purchasedAt
			});
			if (!prediction) return null;

			const explanation =
				prediction.explanation ??
				buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {
					source: prediction.expiresOnSource,
					typicalDays: prediction.typicalDays,
					location: line.location,
					purchasedAt,
					displayName: line.name,
					normalizedKey,
					sampleCount: prediction.sampleCount
				});

			return {
				expiresOn: prediction.expiresOn,
				typicalDays: prediction.typicalDays,
				expiresOnSource: prediction.expiresOnSource,
				confidence: prediction.confidence,
				modelVersion: prediction.modelVersion,
				explanation: explanation ?? undefined
			};
		})
	);

	const refinementIndices = predictions
		.map((prediction, index) => {
			if (!prediction) return null;
			if (
				needsShelfLifeLlmRefinement({
					expiresOnSource: prediction.expiresOnSource,
					confidence: prediction.confidence
				})
			) {
				return index;
			}
			return null;
		})
		.filter((index): index is number => index !== null);

	const working = [...predictions];
	const stillMissing: number[] = [];
	for (let index = 0; index < working.length; index++) {
		if (working[index]) continue;
		const heuristicPred = heuristicPredictionFromLine(lines[index], purchasedAt, todayIso);
		if (heuristicPred) {
			working[index] = heuristicPred;
		} else {
			stillMissing.push(index);
		}
	}

	const aiTargetIndices = [
		...new Set([...refinementIndices, ...stillMissing])
	];

	const aiEnabled = isReceiptAiBatchEnabled();
	if (aiTargetIndices.length === 0 || !options.apiKey || !aiEnabled) {
		return working;
	}

	const alreadyResolved = working
		.map((prediction, index) => {
			if (!prediction) return null;
			if (aiTargetIndices.includes(index)) return null;
			return {
				index,
				expiresOn: prediction.expiresOn,
				source: String(prediction.expiresOnSource)
			};
		})
		.filter((entry): entry is { index: number; expiresOn: string; source: string } => entry !== null);

	const aiEstimates = await predictShelfLifeAiBatch(
		options.apiKey,
		aiTargetIndices,
		lines,
		purchasedAt,
		storeLabel,
		todayIso,
		alreadyResolved,
		householdId,
		options.shelfLifeRules,
		feedback
	);

	return working.map((prediction, index) => {
		const aiEstimate = aiEstimates.get(index);
		if (aiEstimate) {
			return buildPredictionFromAiEstimate(lines[index], aiEstimate, purchasedAt, todayIso);
		}
		return prediction;
	});
}
