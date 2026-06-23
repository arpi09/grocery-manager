import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { computeTypicalDaysFromPurchaseAndConsume } from '$lib/domain/learning/consumption-velocity';
import { daysBetweenIso, formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';

/** Record implicit shelf-life feedback when user marks item finished. */
export async function recordConsumptionShelfLifeFeedback(params: {
	learningEngine: LearningEngineService;
	householdId: string;
	userId: string;
	item: InventoryItem;
	finished: boolean;
}): Promise<void> {
	if (!isShelfLifeLearningEnabled() || !params.finished) return;
	if (!params.item.expiresOn) return;

	const normalizedKey = normalizeReceiptProductName(params.item.name);
	if (!normalizedKey) return;

	const purchasedAt =
		params.item.createdAt instanceof Date
			? params.item.createdAt.toISOString().slice(0, 10)
			: formatTodayIso();
	const consumedAt = formatTodayIso();

	const sample = computeTypicalDaysFromPurchaseAndConsume(
		purchasedAt,
		consumedAt,
		params.item.expiresOn
	);
	if (!sample) return;

	await params.learningEngine.recordConsumptionVelocityFeedback({
		householdId: params.householdId,
		userId: params.userId,
		normalizedKey,
		context: {
			location: params.item.location,
			purchasedAt,
			productName: params.item.name,
			source: 'consumption_velocity',
			quantity: params.item.quantity,
			unit: params.item.unit ?? null
		},
		predictedExpiresOn: params.item.expiresOn,
		predictedTypicalDays: daysBetweenIso(purchasedAt, params.item.expiresOn),
		consumedAt,
		observedTypicalDays: sample.typicalDays,
		strength: sample.strength,
		modelVersion: params.item.expiresOnSource ?? 'unknown'
	});
}
