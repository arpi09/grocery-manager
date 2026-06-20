import { and, eq } from 'drizzle-orm';
import type {
	CreateInventoryItemInput,
	InventoryItem,
	UpdateInventoryItemInput
} from '$lib/domain/inventory-item';
import type { AppDatabase } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import { mapInventoryRow } from './inventory-repository.shared';

export class InventoryCrudRepository {
	constructor(private readonly database: AppDatabase) {}

	async create(
		householdId: string,
		userId: string,
		id: string,
		input: CreateInventoryItemInput
	): Promise<InventoryItem> {
		const now = new Date();
		const [row] = await this.database
			.insert(inventoryItemTable)
			.values({
				id,
				householdId,
				userId,
				name: input.name,
				location: input.location,
				quantity: input.quantity,
				unit: input.unit ?? null,
				expiresOn: input.expiresOn ?? null,
				expiresOnSource: input.expiresOnSource ?? null,
				notes: input.notes ?? null,
				barcode: input.barcode ?? null,
				lastConfirmedAt: input.lastConfirmedAt ?? now,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		return mapInventoryRow(row);
	}

	async update(
		householdId: string,
		id: string,
		input: UpdateInventoryItemInput
	): Promise<InventoryItem | null> {
		const [row] = await this.database
			.update(inventoryItemTable)
			.set({
				...(input.name !== undefined && { name: input.name }),
				...(input.location !== undefined && { location: input.location }),
				...(input.quantity !== undefined && { quantity: input.quantity }),
				...(input.unit !== undefined && { unit: input.unit }),
				...(input.expiresOn !== undefined && { expiresOn: input.expiresOn }),
				...(input.expiresOnSource !== undefined && { expiresOnSource: input.expiresOnSource }),
				...(input.notes !== undefined && { notes: input.notes }),
				...(input.lastConfirmedAt !== undefined && { lastConfirmedAt: input.lastConfirmedAt }),
				updatedAt: new Date()
			})
			.where(and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId)))
			.returning();

		return row ? mapInventoryRow(row) : null;
	}

	async delete(householdId: string, id: string): Promise<boolean> {
		const result = await this.database
			.delete(inventoryItemTable)
			.where(and(eq(inventoryItemTable.id, id), eq(inventoryItemTable.householdId, householdId)))
			.returning();

		return result.length > 0;
	}
}
