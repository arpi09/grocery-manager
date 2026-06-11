import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import type { LastPaidPrice } from '$lib/domain/price-memory';
import type { IPriceMemoryRepository } from '$lib/infrastructure/repositories/price-memory.repository';

export class PriceMemoryService {
	constructor(private readonly repository: IPriceMemoryRepository) {}

	async getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null> {
		const normalized = normalizeReceiptProductName(normalizedKey);
		if (!normalized) return null;
		return this.repository.getLastPaidPrice(householdId, normalized);
	}
}
