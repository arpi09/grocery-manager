import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';

import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';

import { buildShelfLifeExplanationFromSource } from '$lib/domain/learning/prediction-explain';

import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

import { extractPrintedBbfForProductLine } from '$lib/domain/receipt-printed-bbf';

import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

import { shelfLifeEstimateToExpiresOnSource } from '$lib/domain/shelf-life-estimate';

import { DEFAULT_LOCALE } from '$lib/i18n/locale';

import { SHELF_LIFE_CATEGORY_ANCHORS } from '$lib/server/ai-prompt-shared';

import { isReceiptAiBatchEnabled } from '$lib/server/brain-feature-flags';

import { predictHeuristicShelfLife } from '$lib/infrastructure/adapters/heuristic-shelf-life.adapter';

import { requestStructuredJson } from '$lib/server/openai';



const SHELF_LIFE_BATCH_MAX_LINES = 40;

const HEURISTIC_AI_SKIP_TOLERANCE = 0.2;



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

	'- fridge: kortare, freezer: längre, cupboard: medellång',

	'- Använd brand, packageSize, categoryHint, quantity, unit och storeLabel när de finns',

	SHELF_LIFE_CATEGORY_ANCHORS,

	'- max 40 rader'

].join('\n');



export interface PredictReceiptLinesShelfLifeOptions {

	apiKey?: string;

	todayIso?: string;

	storeLabel?: string | null;

	receiptText?: string | null;

	/** Clear session AI cache (e.g. new upload). */

	clearCache?: boolean;

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



function aiEstimateWithinHeuristicTolerance(

	aiDays: number,

	heuristicDays: number

): boolean {

	const delta = Math.abs(aiDays - heuristicDays) / Math.max(heuristicDays, 1);

	return delta <= HEURISTIC_AI_SKIP_TOLERANCE;

}



async function predictShelfLifeAiBatch(

	apiKey: string,

	indices: number[],

	lines: ReceiptLine[],

	purchasedAt: string | null,

	storeLabel: string | null,

	todayIso: string

): Promise<Map<number, { estimatedDays: number; confidence: number }>> {

	const result = new Map<number, { estimatedDays: number; confidence: number }>();

	if (indices.length === 0) return result;



	const uncachedIndices: number[] = [];

	for (const index of indices.slice(0, SHELF_LIFE_BATCH_MAX_LINES)) {

		const line = lines[index];

		const key = cacheKey(normalizeReceiptProductName(line.name), line.location);

		const cached = sessionAiCache.get(key);

		if (cached) {

			result.set(index, cached);

		} else {

			const heuristic = predictHeuristicShelfLife({

				productName: line.name,

				location: line.location,

				purchasedAt,

				todayIso,

				categoryHint: line.categoryHint ?? null

			});

			if (heuristic && line.categoryHint) {

				result.set(index, {

					estimatedDays: heuristic.typicalDays,

					confidence: 0.5

				});

				continue;

			}

			uncachedIndices.push(index);

		}

	}



	if (uncachedIndices.length === 0) return result;



	const payload = uncachedIndices.map((index) => {

		const line = lines[index];

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

			storeLabel

		};

	});



	const aiResult = await requestStructuredJson(apiKey, {

		systemPrompt: SHELF_LIFE_BATCH_SYSTEM_PROMPT,

		userPrompt: JSON.stringify({ purchasedAt, storeLabel, lines: payload }),

		schemaName: 'receipt_shelf_life_batch',

		schema: RECEIPT_SHELF_LIFE_BATCH_SCHEMA

	});



	if (!aiResult.ok) {

		console.warn('[receipt] Shelf-life AI batch failed:', aiResult.status);

		return result;

	}



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

			sessionAiCache.set(

				cacheKey(normalizeReceiptProductName(line.name), line.location),

				estimate

			);

			continue;

		}



		const estimate = { estimatedDays, confidence };

		result.set(index, estimate);

		sessionAiCache.set(cacheKey(normalizeReceiptProductName(line.name), line.location), estimate);

	}



	return result;

}



function applyPrintedBbf(

	line: ReceiptLine,

	receiptText: string | null,

	purchasedAt: string | null,

	todayIso: string

): ReceiptShelfLifePrediction | null {

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



	const missingIndices = predictions

		.map((prediction, index) => (prediction ? null : index))

		.filter((index): index is number => index !== null);



	const heuristicFilled = [...predictions];

	const stillMissing: number[] = [];

	for (const index of missingIndices) {

		const heuristicPred = heuristicPredictionFromLine(lines[index], purchasedAt, todayIso);

		if (heuristicPred) {

			heuristicFilled[index] = heuristicPred;

		} else {

			stillMissing.push(index);

		}

	}



	const aiEnabled = isReceiptAiBatchEnabled();

	if (stillMissing.length === 0 || !options.apiKey || !aiEnabled) {

		return heuristicFilled;

	}



	const aiEstimates = await predictShelfLifeAiBatch(

		options.apiKey,

		stillMissing,

		lines,

		purchasedAt,

		storeLabel,

		todayIso

	);



	return heuristicFilled.map((prediction, index) => {

		if (prediction) return prediction;

		const aiEstimate = aiEstimates.get(index);

		if (!aiEstimate) return null;

		return buildPredictionFromAiEstimate(lines[index], aiEstimate, purchasedAt, todayIso);

	});

}

