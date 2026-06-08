import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import {
	addQuantities,
	findLastActiveByNormalizedName,
	findMergeCandidate
} from '$lib/domain/inventory-merge';
import type { StorageLocation } from '$lib/domain/location';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import {
	DEFAULT_SHOPPING_TO_PANTRY_MODE,
	normalizeShoppingToPantryMode,
	type ShoppingToPantryMode
} from '$lib/domain/shopping-to-pantry';
import type { InventoryService } from './inventory.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';

export class ShoppingToPantryReadOnlyError extends Error {
	constructor() {
		super('readonly');
		this.name = 'ShoppingToPantryReadOnlyError';
	}
}

export interface PantryBridgePreview {
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	mergeCandidate: {
		id: string;
		name: string;
		quantity: string;
		unit: string | null;
	} | null;
}

export interface AddToPantryFromShoppingInput {
	location: StorageLocation;
	quantity?: string;
	unit?: string | null;
	merge?: boolean;
}

export class ShoppingToPantryService {
	constructor(
		private readonly inventoryService: InventoryService,
		private readonly users: IUserRepository
	) {}

	async getMode(userId: string): Promise<ShoppingToPantryMode> {
		const mode = await this.users.getShoppingToPantryMode(userId);
		return normalizeShoppingToPantryMode(mode ?? DEFAULT_SHOPPING_TO_PANTRY_MODE);
	}

	async setMode(userId: string, mode: ShoppingToPantryMode): Promise<ShoppingToPantryMode> {
		const updated = await this.users.updateShoppingToPantryMode(userId, mode);
		return normalizeShoppingToPantryMode(updated ?? DEFAULT_SHOPPING_TO_PANTRY_MODE);
	}

	async previewAdd(householdId: string, item: ShoppingListItem): Promise<PantryBridgePreview> {
		const inventory = await this.inventoryService.listAll(householdId);
		const lastMatch = findLastActiveByNormalizedName(inventory, item.name);
		const location = lastMatch?.location ?? 'cupboard';
		const quantity = item.quantity?.trim() || '1';
		const unit = item.unit?.trim() || lastMatch?.unit || null;
		const mergeCandidate = findMergeCandidate(inventory, item.name, location);

		return {
			location,
			quantity,
			unit,
			mergeCandidate: mergeCandidate
				? {
						id: mergeCandidate.id,
						name: mergeCandidate.name,
						quantity: mergeCandidate.quantity,
						unit: mergeCandidate.unit
					}
				: null
		};
	}

	async addFromShopping(
		householdId: string,
		userId: string,
		role: HouseholdRole,
		item: ShoppingListItem,
		input: AddToPantryFromShoppingInput
	) {
		if (!canEditInventory(role)) {
			throw new ShoppingToPantryReadOnlyError();
		}

		const quantity = input.quantity?.trim() || item.quantity?.trim() || '1';
		const unit = input.unit?.trim() || item.unit?.trim() || null;
		const location = input.location;

		if (input.merge !== false) {
			const inventory = await this.inventoryService.listAll(householdId);
			const candidate = findMergeCandidate(inventory, item.name, location);
			if (candidate) {
				const merged = await this.inventoryService.incrementQuantity(
					householdId,
					candidate.id,
					quantity,
					role
				);
				return { action: 'merged' as const, item: merged };
			}
		}

		const created = await this.inventoryService.createItem(
			householdId,
			userId,
			{
				name: item.name,
				location,
				quantity,
				unit,
				expiresOn: null,
				notes: null
			},
			role
		);
		return { action: 'created' as const, item: created };
	}
}
