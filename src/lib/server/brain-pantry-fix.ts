import type { HouseholdRole } from '$lib/domain/household';
import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isItemFinished } from '$lib/domain/inventory-item';
import { normalizeInventoryItemName } from '$lib/domain/inventory-merge';
import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import { buildInventoryInsights } from '$lib/server/inventory-insights';
import { bulkInferMissingExpiryForLocation } from '$lib/server/bulk-infer-missing-expiry';
import type { InventoryService } from '$lib/application/inventory.service';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';

export interface PantryMergeSuggestion {
	sourceId: string;
	sourceName: string;
	targetId: string;
	targetName: string;
	location: StorageLocation;
}

export interface PantryFixResult {
	inferredExpiryCount: number;
	mergeSuggestions: PantryMergeSuggestion[];
	eatFirstItems: Array<{
		id: string;
		name: string;
		expiresOn: string | null;
		location: StorageLocation;
		daysUntilExpiry: number | null;
	}>;
	insights: ReturnType<typeof buildInventoryInsights>;
}

export interface RunPantryFixInput {
	householdId: string;
	actorRole: HouseholdRole;
	inventoryService: InventoryService;
	apiKey: string | null;
	learningFeedbackRepository?: ILearningFeedbackRepository;
	inferExpiry?: boolean;
	suggestMerges?: boolean;
}

function detectDuplicateMergeSuggestions(
	items: Awaited<ReturnType<InventoryService['listAll']>>
): PantryMergeSuggestion[] {
	const active = items.filter((item) => !isItemFinished(item));
	const groups = new Map<string, typeof active>();

	for (const item of active) {
		const key = `${item.location}:${normalizeInventoryItemName(item.name)}`;
		const bucket = groups.get(key) ?? [];
		bucket.push(item);
		groups.set(key, bucket);
	}

	const suggestions: PantryMergeSuggestion[] = [];

	for (const bucket of groups.values()) {
		if (bucket.length < 2) continue;
		const sorted = [...bucket].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		const target = sorted[0]!;
		for (const source of sorted.slice(1)) {
			suggestions.push({
				sourceId: source.id,
				sourceName: source.name,
				targetId: target.id,
				targetName: target.name,
				location: source.location
			});
		}
	}

	return suggestions.slice(0, 12);
}

export async function runPantryFixBatch(input: RunPantryFixInput): Promise<PantryFixResult> {
	const inferExpiry = input.inferExpiry !== false;
	const suggestMerges = input.suggestMerges !== false;

	let inferredExpiryCount = 0;
	if (inferExpiry) {
		for (const location of LOCATIONS) {
			inferredExpiryCount += await bulkInferMissingExpiryForLocation(
				input.householdId,
				location,
				input.inventoryService,
				input.apiKey,
				input.actorRole,
				input.learningFeedbackRepository
			);
		}
	}

	const items = await input.inventoryService.listAll(input.householdId);
	const expiring = filterItemsExpiringWithinDays(items, EXPIRING_SOON_DAYS);
	const insights = buildInventoryInsights(items);

	return {
		inferredExpiryCount,
		mergeSuggestions: suggestMerges ? detectDuplicateMergeSuggestions(items) : [],
		eatFirstItems: expiring.map((item) => ({
			id: item.id,
			name: item.name,
			expiresOn: item.expiresOn,
			location: item.location,
			daysUntilExpiry: item.expiresOn
				? Math.max(
						0,
						Math.ceil(
							(new Date(`${item.expiresOn}T12:00:00`).getTime() -
								new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00`).getTime()) /
								86_400_000
						)
					)
				: null
		})),
		insights
	};
}
