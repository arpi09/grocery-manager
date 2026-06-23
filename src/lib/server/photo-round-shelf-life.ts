import type { PhotoRoundDetectedItem } from '$lib/domain/photo-round';
import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { predictReceiptLinesShelfLife } from '$lib/server/receipt-shelf-life-predictions';

export function photoRoundItemsToReceiptLines(items: PhotoRoundDetectedItem[]): ReceiptLine[] {
	return items.map((item) => ({
		name: item.name,
		quantity: item.quantity,
		unit: item.unit,
		location: item.location
	}));
}

export async function enrichPhotoRoundShelfLife(
	householdId: string,
	items: PhotoRoundDetectedItem[],
	learningEngine: LearningEngineService,
	options: { apiKey?: string; todayIso?: string } = {}
): Promise<(ReceiptShelfLifePrediction | null)[]> {
	const lines = photoRoundItemsToReceiptLines(items);
	const predictions = await predictReceiptLinesShelfLife(
		householdId,
		lines,
		null,
		learningEngine,
		options
	);

	// Prefer ladder over raw AI expiresOn on photo items when ladder returns a value
	return predictions.map((prediction, index) => {
		if (prediction) return prediction;
		const item = items[index];
		if (!item.expiresOn?.trim()) return null;
		return {
			expiresOn: item.expiresOn,
			typicalDays: 7,
			expiresOnSource: 'user_set' as const,
			confidence: item.confidence === 'high' ? 0.85 : item.confidence === 'medium' ? 0.6 : 0.35,
			modelVersion: 'photo-round-label-v1'
		};
	});
}
