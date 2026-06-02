import type { ExpiresOnSource } from './auto-expired';
import type { StorageLocation } from './location';

export interface InventoryItem {
	id: string;
	householdId: string;
	userId: string;
	name: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	expiresOn: string | null;
	expiresOnSource: ExpiresOnSource | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateInventoryItemInput {
	name: string;
	location: StorageLocation;
	quantity: string;
	unit?: string | null;
	expiresOn?: string | null;
	expiresOnSource?: ExpiresOnSource | null;
	inferExpiry?: boolean;
	notes?: string | null;
}

export interface UpdateInventoryItemInput {
	name?: string;
	location?: StorageLocation;
	quantity?: string;
	unit?: string | null;
	expiresOn?: string | null;
	expiresOnSource?: ExpiresOnSource | null;
	notes?: string | null;
}

export interface LocationCount {
	location: StorageLocation;
	count: number;
}

export function isItemFinished(item: Pick<InventoryItem, 'quantity'>): boolean {
	const quantity = Number(item.quantity);
	return !Number.isNaN(quantity) && quantity <= 0;
}
