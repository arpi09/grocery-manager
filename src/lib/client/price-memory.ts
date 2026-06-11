import type { LastPaidPrice } from '$lib/domain/price-memory';

export async function fetchLastPaidPrice(normalizedKey: string): Promise<LastPaidPrice | null> {
	const key = normalizedKey.trim();
	if (!key) return null;
	const response = await fetch(`/api/price-memory/last?key=${encodeURIComponent(key)}`);
	if (!response.ok) return null;
	const data = (await response.json()) as { lastPaidPrice?: LastPaidPrice | null };
	return data.lastPaidPrice ?? null;
}
