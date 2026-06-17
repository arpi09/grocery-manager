import type { PmfService } from '$lib/application/pmf.service';
import type { MatchedLevel, PurchaseMemorySummary } from '$lib/domain/price-memory';
import {
	bucketPriceMemoryCount,
	bucketPriceMemoryQueryLength,
	bucketPriceMemoryResultCount,
	type PriceMemoryEntryPoint
} from '$lib/domain/pmf';
import { recordProductEvent } from '$lib/server/product-events';

function parseEntryPoint(value: string | null | undefined): PriceMemoryEntryPoint | undefined {
	if (
		value === 'inventory' ||
		value === 'replenishment' ||
		value === 'search' ||
		value === 'product_detail' ||
		value === 'settings'
	) {
		return value;
	}
	return undefined;
}

function summaryMetadata(
	summary: PurchaseMemorySummary | null,
	entryPoint?: PriceMemoryEntryPoint
): Record<string, unknown> {
	return {
		matchedLevel: summary?.matchedLevel ?? 'raw',
		purchaseCountBucket: bucketPriceMemoryCount(summary?.purchaseCount ?? 0),
		retailerCountBucket: bucketPriceMemoryCount(summary?.retailerCount ?? 0),
		hasLastPaid: summary?.lastPaid != null,
		...(entryPoint ? { entryPoint } : {})
	};
}

export function emitPriceMemorySummaryViewed(
	pmfService: PmfService,
	input: {
		userId: string;
		householdId: string;
		summary: PurchaseMemorySummary | null;
		entryPoint?: string | null;
	}
): void {
	const entryPoint = parseEntryPoint(input.entryPoint);
	const metadata = summaryMetadata(input.summary, entryPoint);

	if (!input.summary || input.summary.purchaseCount === 0) {
		recordProductEvent(pmfService, {
			userId: input.userId,
			householdId: input.householdId,
			eventType: 'price_memory_empty_state_seen',
			metadata
		});
		return;
	}

	recordProductEvent(pmfService, {
		userId: input.userId,
		householdId: input.householdId,
		eventType: 'price_memory_product_opened',
		metadata
	});
}

export function emitPriceMemoryTimelineViewed(
	pmfService: PmfService,
	input: {
		userId: string;
		householdId: string;
		matchedLevel: MatchedLevel;
		entryCount: number;
		entryPoint?: string | null;
	}
): void {
	const entryPoint = parseEntryPoint(input.entryPoint);
	recordProductEvent(pmfService, {
		userId: input.userId,
		householdId: input.householdId,
		eventType: 'price_memory_timeline_viewed',
		metadata: {
			matchedLevel: input.matchedLevel,
			entryCountBucket: bucketPriceMemoryCount(input.entryCount),
			...(entryPoint ? { entryPoint } : {})
		}
	});
}

export function emitPriceMemorySearch(
	pmfService: PmfService,
	input: {
		userId: string;
		householdId: string;
		queryLength: number;
		resultCount: number;
		entryPoint?: string | null;
	}
): void {
	const entryPoint = parseEntryPoint(input.entryPoint);
	recordProductEvent(pmfService, {
		userId: input.userId,
		householdId: input.householdId,
		eventType: 'price_memory_search',
		metadata: {
			queryLengthBucket: bucketPriceMemoryQueryLength(input.queryLength),
			resultCountBucket: bucketPriceMemoryResultCount(input.resultCount),
			...(entryPoint ? { entryPoint } : {})
		}
	});
}
