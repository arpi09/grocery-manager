import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import { generateId } from '$lib/infrastructure/auth/id';
import type { IShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';

function normalizeShoppingItemName(name: string): string {
	return name.trim().toLowerCase();
}

export class ShoppingListReadOnlyError extends Error {
	constructor() {
		super('readonly');
	}
}
export class ShoppingListNotFoundError extends Error {
	constructor() {
		super('not found');
	}
}

export interface AddSuggestedItemsResult {
	added: number;
	skipped: number;
}

export class ShoppingListService {
	constructor(private readonly repository: IShoppingListRepository) {}

	listItems(householdId: string) {
		return this.repository.listByHousehold(householdId);
	}

	listUncheckedItems(householdId: string) {
		return this.repository.listUncheckedByHousehold(householdId);
	}

	listCheckedItems(householdId: string) {
		return this.repository.listCheckedByHousehold(householdId);
	}

	countCheckedItems(householdId: string) {
		return this.repository.countCheckedByHousehold(householdId);
	}

	async addItem(householdId: string, role: HouseholdRole, input: CreateShoppingListItemInput) {
		if (!canEditInventory(role)) throw new ShoppingListReadOnlyError();
		return this.repository.create(
			householdId,
			generateId(),
			input,
			await this.repository.nextSortOrder(householdId)
		);
	}

	async addSuggestedItems(
		householdId: string,
		role: HouseholdRole,
		inputs: CreateShoppingListItemInput[]
	): Promise<AddSuggestedItemsResult> {
		if (!canEditInventory(role)) throw new ShoppingListReadOnlyError();

		const existing = await this.repository.listByHousehold(householdId);
		const seen = new Set(existing.map((item) => normalizeShoppingItemName(item.name)));

		let added = 0;
		let skipped = 0;

		for (const input of inputs) {
			const key = normalizeShoppingItemName(input.name);
			if (!key || seen.has(key)) {
				skipped++;
				continue;
			}
			seen.add(key);
			await this.repository.create(
				householdId,
				generateId(),
				input,
				await this.repository.nextSortOrder(householdId)
			);
			added++;
		}

		return { added, skipped };
	}

	async toggleChecked(householdId: string, role: HouseholdRole, id: string) {
		if (!canEditInventory(role)) throw new ShoppingListReadOnlyError();
		const e = await this.repository.findById(householdId, id);
		if (!e) throw new ShoppingListNotFoundError();
		const u = await this.repository.setChecked(householdId, id, !e.checked);
		if (!u) throw new ShoppingListNotFoundError();
		return u;
	}

	async removeItem(householdId: string, role: HouseholdRole, id: string) {
		if (!canEditInventory(role)) throw new ShoppingListReadOnlyError();
		if (!(await this.repository.delete(householdId, id))) throw new ShoppingListNotFoundError();
	}

	async clearChecked(householdId: string, role: HouseholdRole) {
		if (!canEditInventory(role)) throw new ShoppingListReadOnlyError();
		return this.repository.deleteChecked(householdId);
	}
}
