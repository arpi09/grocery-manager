import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import type {
	LastPaidPrice,
	PurchaseMemorySearchResult,
	PurchaseMemorySummary,
	PurchaseMemoryTimelineEntry
} from '$lib/domain/price-memory';
import type { IPriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';

export class PriceMemoryService {
	constructor(private readonly repository: IPriceMemoryRepository) {}

	async getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null> {
		const normalized = normalizeReceiptProductName(normalizedKey);
		if (!normalized) return null;
		return this.repository.getLastPaidPrice(householdId, normalized);
	}

	async getSummaryByInventoryItemId(
		householdId: string,
		inventoryItemId: string
	): Promise<PurchaseMemorySummary | null> {
		if (!inventoryItemId.trim()) return null;
		return this.repository.getSummaryByInventoryItemId(householdId, inventoryItemId.trim());
	}

	async getSummaryByKey(householdId: string, normalizedKey: string): Promise<PurchaseMemorySummary | null> {
		const normalized = normalizeReceiptProductName(normalizedKey);
		if (!normalized) return null;
		return this.repository.getSummaryByKey(householdId, normalized);
	}

	async getSummaryByConceptKey(
		householdId: string,
		conceptKey: string
	): Promise<PurchaseMemorySummary | null> {
		const normalized = normalizeReceiptProductName(conceptKey);
		if (!normalized) return null;
		return this.repository.getSummaryByConceptKey(householdId, normalized);
	}

	async getTimelineByKey(
		householdId: string,
		normalizedKey: string
	): Promise<PurchaseMemoryTimelineEntry[]> {
		const normalized = normalizeReceiptProductName(normalizedKey);
		if (!normalized) return [];
		return this.repository.getTimelineByKey(householdId, normalized);
	}

	async getTimelineByConceptKey(
		householdId: string,
		conceptKey: string
	): Promise<PurchaseMemoryTimelineEntry[]> {
		const normalized = normalizeReceiptProductName(conceptKey);
		if (!normalized) return [];
		return this.repository.getTimelineByConceptKey(householdId, normalized);
	}

	async search(
		householdId: string,
		query: string,
		limit?: number
	): Promise<PurchaseMemorySearchResult[]> {
		const trimmed = query.trim();
		if (!trimmed) return [];
		return this.repository.search(householdId, trimmed, limit);
	}
}
