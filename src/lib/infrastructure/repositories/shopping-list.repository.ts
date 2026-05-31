import { and, asc, eq } from 'drizzle-orm';
import type { CreateShoppingListItemInput, ShoppingListItem } from '$lib/domain/shopping-list-item';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { shoppingListItemTable } from '$lib/infrastructure/db/schema';

export interface IShoppingListRepository {
	listByHousehold(householdId: string): Promise<ShoppingListItem[]>;
	findById(householdId: string, id: string): Promise<ShoppingListItem | null>;
	create(
		householdId: string,
		id: string,
		input: CreateShoppingListItemInput,
		sortOrder: number
	): Promise<ShoppingListItem>;
	setChecked(householdId: string, id: string, checked: boolean): Promise<ShoppingListItem | null>;
	delete(householdId: string, id: string): Promise<boolean>;
	deleteChecked(householdId: string): Promise<number>;
	nextSortOrder(householdId: string): Promise<number>;
}

function mapRow(row: typeof shoppingListItemTable.$inferSelect): ShoppingListItem {
	return {
		id: row.id,
		householdId: row.householdId,
		name: row.name,
		quantity: row.quantity,
		unit: row.unit,
		checked: Boolean(row.checked),
		sortOrder: row.sortOrder,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export class DrizzleShoppingListRepository implements IShoppingListRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async listByHousehold(householdId: string) {
		const rows = await this.database
			.select()
			.from(shoppingListItemTable)
			.where(eq(shoppingListItemTable.householdId, householdId))
			.orderBy(asc(shoppingListItemTable.sortOrder), asc(shoppingListItemTable.createdAt));
		return rows.map(mapRow);
	}

	async findById(householdId: string, id: string) {
		const [row] = await this.database
			.select()
			.from(shoppingListItemTable)
			.where(
				and(eq(shoppingListItemTable.id, id), eq(shoppingListItemTable.householdId, householdId))
			)
			.limit(1);
		return row ? mapRow(row) : null;
	}

	async nextSortOrder(householdId: string) {
		const items = await this.listByHousehold(householdId);
		if (items.length === 0) return 0;
		return Math.max(...items.map((item) => item.sortOrder)) + 1;
	}

	async create(householdId: string, id: string, input: CreateShoppingListItemInput, sortOrder: number) {
		const now = new Date();
		const [row] = await this.database
			.insert(shoppingListItemTable)
			.values({
				id,
				householdId,
				name: input.name,
				quantity: input.quantity,
				unit: input.unit,
				checked: false,
				sortOrder,
				createdAt: now,
				updatedAt: now
			})
			.returning();
		return mapRow(row);
	}

	async setChecked(householdId: string, id: string, checked: boolean) {
		const now = new Date();
		const [row] = await this.database
			.update(shoppingListItemTable)
			.set({ checked, updatedAt: now })
			.where(
				and(eq(shoppingListItemTable.id, id), eq(shoppingListItemTable.householdId, householdId))
			)
			.returning();
		return row ? mapRow(row) : null;
	}

	async delete(householdId: string, id: string) {
		const deleted = await this.database
			.delete(shoppingListItemTable)
			.where(
				and(eq(shoppingListItemTable.id, id), eq(shoppingListItemTable.householdId, householdId))
			)
			.returning();
		return deleted.length > 0;
	}

	async deleteChecked(householdId: string) {
		const deleted = await this.database
			.delete(shoppingListItemTable)
			.where(
				and(eq(shoppingListItemTable.householdId, householdId), eq(shoppingListItemTable.checked, true))
			)
			.returning();
		return deleted.length;
	}
}
