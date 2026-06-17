import type {
	LastPaidPrice,
	PurchaseMemorySearchResult,
	PurchaseMemorySummary,
	PurchaseMemoryTimelineEntry
} from '$lib/domain/price-memory';

function parseLastPaid(raw: LastPaidPrice | null | undefined): LastPaidPrice | null {
	if (!raw) return null;
	return {
		...raw,
		purchasedAt: new Date(raw.purchasedAt)
	};
}

function parseSummary(raw: PurchaseMemorySummary | null | undefined): PurchaseMemorySummary | null {
	if (!raw) return null;
	return {
		...raw,
		lastPaid: parseLastPaid(raw.lastPaid)
	};
}

function parseTimeline(entries: PurchaseMemoryTimelineEntry[]): PurchaseMemoryTimelineEntry[] {
	return entries.map((entry) => ({
		...entry,
		purchasedAt: new Date(entry.purchasedAt)
	}));
}

export async function fetchLastPaidPrice(normalizedKey: string): Promise<LastPaidPrice | null> {
	const key = normalizedKey.trim();
	if (!key) return null;
	const response = await fetch(`/api/price-memory/last?key=${encodeURIComponent(key)}`);
	if (!response.ok) return null;
	const data = (await response.json()) as { lastPaidPrice?: LastPaidPrice | null };
	return parseLastPaid(data.lastPaidPrice);
}

export async function fetchPurchaseMemorySummary(input: {
	inventoryItemId?: string;
	key?: string;
	conceptKey?: string;
	entryPoint?: string;
}): Promise<PurchaseMemorySummary | null> {
	const params = new URLSearchParams();
	if (input.inventoryItemId) params.set('inventoryItemId', input.inventoryItemId);
	else if (input.conceptKey) params.set('conceptKey', input.conceptKey);
	else if (input.key) params.set('key', input.key);
	else return null;
	if (input.entryPoint) params.set('entryPoint', input.entryPoint);

	const response = await fetch(`/api/price-memory/summary?${params.toString()}`);
	if (!response.ok) return null;
	const data = (await response.json()) as { summary?: PurchaseMemorySummary | null };
	return parseSummary(data.summary);
}

export async function fetchPurchaseMemoryTimeline(input: {
	key?: string;
	conceptKey?: string;
	entryPoint?: string;
}): Promise<PurchaseMemoryTimelineEntry[]> {
	const params = new URLSearchParams();
	if (input.conceptKey) params.set('conceptKey', input.conceptKey);
	else if (input.key) params.set('key', input.key);
	else return [];
	if (input.entryPoint) params.set('entryPoint', input.entryPoint);

	const response = await fetch(`/api/price-memory/timeline?${params.toString()}`);
	if (!response.ok) return [];
	const data = (await response.json()) as { timeline?: PurchaseMemoryTimelineEntry[] };
	return parseTimeline(data.timeline ?? []);
}

export async function searchPurchaseMemory(
	query: string,
	entryPoint?: string
): Promise<PurchaseMemorySearchResult[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];
	const params = new URLSearchParams({ q: trimmed });
	if (entryPoint) params.set('entryPoint', entryPoint);
	const response = await fetch(`/api/price-memory/search?${params.toString()}`);
	if (!response.ok) return [];
	const data = (await response.json()) as { results?: PurchaseMemorySearchResult[] };
	return (data.results ?? []).map((result) => ({
		...result,
		lastPaid: parseLastPaid(result.lastPaid)
	}));
}
