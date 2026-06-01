import type { InventoryAnalytics } from '$lib/application/inventory.service';

export async function fetchStatistikAnalytics(): Promise<InventoryAnalytics> {
	const response = await fetch('/api/statistik/analytics');
	if (!response.ok) {
		throw new Error(`Statistics request failed (${response.status})`);
	}

	return (await response.json()) as InventoryAnalytics;
}
