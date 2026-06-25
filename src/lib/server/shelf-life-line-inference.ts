import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import { needsShelfLifeLlmRefinement } from '$lib/domain/shelf-life-confidence';
import { predictHeuristicShelfLife } from '$lib/infrastructure/adapters/heuristic-shelf-life.adapter';
import {
	resolveLocationDefaultShelfLife,
	shelfLifeEstimateToExpiresOnSource
} from '$lib/domain/shelf-life-estimate';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isReceiptAiBatchEnabled } from '$lib/server/feature-flags';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import { getOpenAiApiKey } from '$lib/server/openai';
import { inferShelfLifeSingleLlm } from '$lib/server/receipt-shelf-life-predictions';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';

export type ShelfLifeInferPath = 'receipt_batch' | 'line_infer' | 'single_llm' | 'heuristic';

export interface InferredLineShelfLife {
	expiresOn: string;
	expiresOnSource: ExpiresOnSource;
	typicalDays: number | null;
	modelVersion: string;
	inferPath?: ShelfLifeInferPath;
}

export interface InferShelfLifeWithRefinementInput {
	learningEngine: LearningEngineService;
	householdId: string;
	name: string;
	location: StorageLocation;
	purchasedAt: string | null;
	apiKey?: string | null;
}

export async function inferShelfLifeWithRefinement(
	input: InferShelfLifeWithRefinementInput
): Promise<InferredLineShelfLife | null> {
	const { learningEngine, householdId, name, location, purchasedAt } = input;
	const normalizedKey = normalizeReceiptProductName(name);
	if (!normalizedKey) return null;

	const apiKey = input.apiKey ?? getOpenAiApiKey();

	if (isShelfLifeLearningEnabled()) {
		const prediction = await learningEngine.predictShelfLife(householdId, {
			productName: name,
			normalizedKey,
			location,
			purchasedAt
		});
		if (!prediction) return null;

		if (
			needsShelfLifeLlmRefinement({
				expiresOnSource: prediction.expiresOnSource,
				confidence: prediction.confidence
			}) &&
			apiKey &&
			isReceiptAiBatchEnabled()
		) {
			const llm = await inferShelfLifeSingleLlm(apiKey, {
				name,
				location,
				purchasedAt
			});
			if (llm) {
				logInferPath('single_llm', prediction.modelVersion);
				return {
					expiresOn: llm.expiresOn,
					expiresOnSource: 'ai_inferred',
					typicalDays: llm.typicalDays,
					modelVersion: 'gpt-shelf-life-single',
					inferPath: 'single_llm'
				};
			}
		}

		logInferPath('line_infer', prediction.modelVersion);
		return {
			expiresOn: prediction.expiresOn,
			expiresOnSource: prediction.expiresOnSource,
			typicalDays: prediction.typicalDays,
			modelVersion: prediction.modelVersion,
			inferPath: 'line_infer'
		};
	}

	const heuristic = predictHeuristicShelfLife({
		productName: name,
		location,
		purchasedAt
	});
	if (heuristic) {
		logInferPath('heuristic', 'heuristic-v1');
		return {
			expiresOn: heuristic.expiresOn,
			expiresOnSource: heuristic.source,
			typicalDays: heuristic.typicalDays,
			modelVersion: 'heuristic-v1',
			inferPath: 'heuristic'
		};
	}

	const locationDefault = resolveLocationDefaultShelfLife({ location, purchasedAt });
	logInferPath('heuristic', 'location-default-v1');
	return {
		expiresOn: locationDefault.expiresOn,
		expiresOnSource: shelfLifeEstimateToExpiresOnSource(locationDefault.source),
		typicalDays: locationDefault.typicalDays,
		modelVersion: 'location-default-v1',
		inferPath: 'heuristic'
	};
}

export async function inferLineShelfLife(
	learningEngine: LearningEngineService,
	householdId: string,
	name: string,
	location: StorageLocation,
	purchasedAt: string | null
): Promise<InferredLineShelfLife | null> {
	return inferShelfLifeWithRefinement({
		learningEngine,
		householdId,
		name,
		location,
		purchasedAt
	});
}

function logInferPath(inferPath: ShelfLifeInferPath, modelVersion: string): void {
	logBrainMetrics('infer_path', {
		source: 'shelf_life_infer',
		promptVersion: modelVersion,
		inferPath
	});
}
