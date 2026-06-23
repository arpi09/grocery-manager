export const KIVRA_IMPORT_PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export interface KivraImportPendingEntry {
	householdId: string;
	itemsAdded: number;
	importedAt: number;
}

const pendingByHousehold = new Map<string, KivraImportPendingEntry>();

function purgeExpired(now = Date.now()): void {
	for (const [householdId, entry] of pendingByHousehold) {
		if (now - entry.importedAt > KIVRA_IMPORT_PENDING_TTL_MS) {
			pendingByHousehold.delete(householdId);
		}
	}
}

export function storeKivraImportPending(householdId: string, itemsAdded: number): void {
	purgeExpired();
	pendingByHousehold.set(householdId, {
		householdId,
		itemsAdded,
		importedAt: Date.now()
	});
}

export function takeKivraImportPending(householdId: string): KivraImportPendingEntry | null {
	purgeExpired();
	const entry = pendingByHousehold.get(householdId);
	if (!entry) return null;
	pendingByHousehold.delete(householdId);
	return entry;
}

export function peekKivraImportPending(householdId: string): KivraImportPendingEntry | null {
	purgeExpired();
	return pendingByHousehold.get(householdId) ?? null;
}

/** Test-only */
export function clearKivraImportPendingStoreForTests(): void {
	pendingByHousehold.clear();
}
