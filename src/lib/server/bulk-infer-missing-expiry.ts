import type { HouseholdRole } from '$lib/domain/household';
import { isItemFinished } from '$lib/domain/inventory-item';
import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import type { InventoryService } from '$lib/application/inventory.service';
import { inferMissingExpiryBatch } from '$lib/server/missing-expiry-batch';
import { loadShelfLifePromptFeedbackBlocks } from '$lib/server/receipt-parse-feedback';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';

export async function bulkInferMissingExpiryForLocation(
	householdId: string,
	location: StorageLocation,
	inventoryService: InventoryService,
	apiKey: string | null,
	actorRole: HouseholdRole,
	learningFeedbackRepository?: ILearningFeedbackRepository
): Promise<number> {
	const items = (await inventoryService.listByLocation(householdId, location)).filter(
		(item) => !isItemFinished(item) && !item.expiresOn
	);
	if (items.length === 0) return 0;

	let inferredCount = 0;

	if (apiKey) {
		const shelfLifeFeedback = learningFeedbackRepository
			? await loadShelfLifePromptFeedbackBlocks(learningFeedbackRepository, householdId)
			: { priorCorrectionsBlock: '', globalFewShotBlock: '' };
		const batchEstimates = await inferMissingExpiryBatch(apiKey, items, shelfLifeFeedback);
		for (const estimate of batchEstimates) {
			const updated = await inventoryService.updateItem(
				householdId,
				estimate.itemId,
				{
					expiresOn: estimate.expiresOn,
					expiresOnSource: 'ai_inferred'
				},
				actorRole
			);
			if (updated) inferredCount += 1;
		}
	}

	if (inferredCount >= items.length) {
		return inferredCount;
	}

	return inferredCount + (await inventoryService.bulkInferExpiryForLocation(householdId, location, actorRole));
}

export async function bulkInferMissingExpiryAllLocations(
	householdId: string,
	inventoryService: InventoryService,
	apiKey: string | null,
	actorRole: HouseholdRole,
	learningFeedbackRepository?: ILearningFeedbackRepository
): Promise<number> {
	let total = 0;
	for (const location of LOCATIONS) {
		total += await bulkInferMissingExpiryForLocation(
			householdId,
			location,
			inventoryService,
			apiKey,
			actorRole,
			learningFeedbackRepository
		);
	}
	return total;
}
