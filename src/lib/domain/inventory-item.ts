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
	notes?: string | null;
}

export interface UpdateInventoryItemInput {
	name?: string;
	location?: StorageLocation;
	quantity?: string;
	unit?: string | null;
	expiresOn?: string | null;
	notes?: string | null;
}

export interface LocationCount {
	location: StorageLocation;
	count: number;
}
