import type { InventoryItem } from '$lib/domain/inventory-item';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import type { StorageLocation } from '$lib/domain/location';
import { PROMPT_VERSION_PANTRY_DELTA } from '$lib/server/ai-prompt-shared';
import { formatStructuredInventoryPayload } from '$lib/server/inventory-context';

export interface PantryDeltaSnapshotRow {
	normalizedKey: string;
	name: string;
	quantity: string;
	unit: string | null;
	location: StorageLocation;
}

export function buildPantryDeltaSnapshot(items: InventoryItem[]): PantryDeltaSnapshotRow[] {
	const seen = new Set<string>();
	const rows: PantryDeltaSnapshotRow[] = [];

	for (const item of items) {
		const name = item.name.trim();
		if (!name) continue;
		const normalizedKey = normalizeReceiptProductName(name);
		if (!normalizedKey || seen.has(normalizedKey)) continue;
		seen.add(normalizedKey);
		rows.push({
			normalizedKey,
			name,
			quantity: item.quantity,
			unit: item.unit,
			location: item.location
		});
	}

	return rows;
}

export function pantryDeltaSystemPromptBlock(snapshot: PantryDeltaSnapshotRow[]): string {
	if (snapshot.length === 0) {
		return [
			'Delta-läge: hushållet har inget registrerat skafferi än — lista alla synliga varor.',
			`promptVersion: ${PROMPT_VERSION_PANTRY_DELTA}`
		].join('\n');
	}

	return [
		'Delta-läge (pantry-delta-v1): jämför fotot mot nuvarande skafferisnapshot.',
		'Lista ENDAST varor som är NYA eller tydligt ÄNDRADE (ny förpackning, annan mängd) jämfört med snapshot.',
		'Hoppa över varor som redan finns i snapshot med samma produkt och ungefär samma mängd.',
		'Om osäker om en rad är ny eller befintlig — hoppa över den (hellre för få än dubbletter).',
		`promptVersion: ${PROMPT_VERSION_PANTRY_DELTA}`
	].join('\n');
}

export function buildPantryDeltaUserContext(
	items: InventoryItem[],
	zoneHint: StorageLocation | null,
	imageCount: number
): string {
	const snapshot = buildPantryDeltaSnapshot(items);
	const inventoryBlock =
		snapshot.length > 0
			? formatStructuredInventoryPayload(items, 'sv', { cap: 40 }).lines
			: '[]';

	return [
		zoneHint ? `Zon: ${zoneHint}.` : 'Identifiera zonen från fotot.',
		`Antal foton: ${imageCount}.`,
		'Nuvarande skafferisnapshot (normaliserade nycklar — returnera bara diff):',
		inventoryBlock,
		snapshot.length > 0
			? `Snapshot keys: ${snapshot.map((row) => row.normalizedKey).join(', ')}`
			: ''
	]
		.filter(Boolean)
		.join('\n');
}
