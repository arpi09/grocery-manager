import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { computeExpiresOn, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import { buildShelfLifeExplanationFromSource } from '$lib/domain/learning/prediction-explain';
import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { shelfLifeEstimateToExpiresOnSource } from '$lib/domain/shelf-life-estimate';
import { DEFAULT_LOCALE } from '$lib/i18n/locale';
import { requestStructuredJson } from '$lib/server/openai';

const SHELF_LIFE_BATCH_MAX_LINES = 40;

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

const SHELF_LIFE_BATCH_SYSTEM_PROMPT = [
	'Du uppskattar hÃ¥llbarhet i dagar fÃ¶r svenska livsmedel efter inkÃ¶p.',
	'Returnera JSON: {"estimates":[{"index":0,"estimatedDays":7,"confidence":0.6}]}',
	'Regler:',
	'- estimatedDays: heltal, antal dagar frÃ¥n inkÃ¶psdatum tills varan typiskt hÃ¥ller',
	'- confidence: 0.2â€“0.9 (lÃ¤gre nÃ¤r osÃ¤ker)',
	'- fridge: kortare, freezer: lÃ¤ngre, cupboard: medellÃ¥ng',
	'- max 40 rader'
].join('\n');

export interface PredictReceiptLinesShelfLifeOptions {
	apiKey?: string;
	todayIso?: string;
}

async function predictShelfLifeAiBatch(
	apiKey: string,
	indices: number[],
	lines: ReceiptLine[],
	purchasedAt: string | null
): Promise<Map<number, { estimatedDays: number; confidence: number }>> {
	const result = new Map<number, { estimatedDays: number; confidence: number }>();
	if (indices.length === 0) return result;

	const payload = indices.slice(0, SHELF_LIFE_BATCH_MAX_LINES).map((index) => {
		const line = lines[index];
		return {
			index,
			name: line.name,
			location: line.location,
			categoryHint: line.categoryHint ?? null,
			packageSize: line.packageSize ?? null
		};
	});

	const aiResult = await requestStructuredJson(apiKey, {
		systemPrompt: SHELF_LIFE_BATCH_SYSTEM_PROMPT,
		userPrompt: JSON.stringify({ purchasedAt, lines: payload }),
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
		if (index === null || estimatedDays === null || !indices.includes(index)) continue;
		result.set(index, { estimatedDays, confidence });
	}

	return result;
}

export async function predictReceiptLinesShelfLife(
	householdId: string,
	lines: ReceiptLine[],
	purchasedAt: string | null,
	learningEngine: LearningEngineService,
	options: PredictReceiptLinesShelfLifeOptions = {}
): Promise<(ReceiptShelfLifePrediction | null)[]> {
	const todayIso = options.todayIso ?? formatTodayIso();
	const predictions = await Promise.all(
		lines.map(async (line) => {
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
					normalizedKey
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

	if (missingIndices.length === 0 || !options.apiKey) {
		return predictions;
	}

	const aiEstimates = await predictShelfLifeAiBatch(
		options.apiKey,
		missingIndices,
		lines,
		purchasedAt
	);

	return predictions.map((prediction, index) => {
		if (prediction) return prediction;
		const aiEstimate = aiEstimates.get(index);
		if (!aiEstimate) return null;

		const line = lines[index];
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
	});
}
