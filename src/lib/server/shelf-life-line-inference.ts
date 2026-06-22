import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import { predictHeuristicShelfLife } from '$lib/infrastructure/adapters/heuristic-shelf-life.adapter';
import {
	resolveLocationDefaultShelfLife,
	shelfLifeEstimateToExpiresOnSource
} from '$lib/domain/shelf-life-estimate';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';

export interface InferredLineShelfLife {
	expiresOn: string;
	expiresOnSource: ExpiresOnSource;
	typicalDays: number | null;
	modelVersion: string;
}

export async function inferLineShelfLife(
	learningEngine: LearningEngineService,
	householdId: string,
	name: string,
	location: StorageLocation,
	purchasedAt: string | null
): Promise<InferredLineShelfLife | null> {
	const normalizedKey = normalizeReceiptProductName(name);
	if (!normalizedKey) return null;

	if (isShelfLifeLearningEnabled()) {
		const prediction = await learningEngine.predictShelfLife(householdId, {
			productName: name,
			normalizedKey,
			location,
			purchasedAt
		});
		if (!prediction) return null;

		return {
			expiresOn: prediction.expiresOn,
			expiresOnSource: prediction.expiresOnSource,
			typicalDays: prediction.typicalDays,
			modelVersion: prediction.modelVersion
		};
	}

	const heuristic = predictHeuristicShelfLife({
		productName: name,
		location,
		purchasedAt
	});
	if (heuristic) {
		return {
			expiresOn: heuristic.expiresOn,
			expiresOnSource: heuristic.source,
			typicalDays: heuristic.typicalDays,
			modelVersion: 'heuristic-v1'
		};
	}

	const locationDefault = resolveLocationDefaultShelfLife({ location, purchasedAt });
	return {
		expiresOn: locationDefault.expiresOn,
		expiresOnSource: shelfLifeEstimateToExpiresOnSource(locationDefault.source),
		typicalDays: locationDefault.typicalDays,
		modelVersion: 'location-default-v1'
	};
}
