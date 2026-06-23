import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import {
	deriveHouseholdShoppingCadence,
	type HouseholdShoppingCadence
} from '$lib/domain/household-shopping-cadence';
import {
	detectReceiptFinishSuggestions,
	detectReceiptPatternSuggestions,
	normalizeReceiptProductName,
	receiptFinishDismissKey,
	type ReceiptFinishSuggestion,
	type ReceiptPatternSuggestion,
	type RecordReceiptPurchaseLineInput
} from '$lib/domain/purchase-pattern';
import {
	detectReplenishmentSuggestions,
	type ReplenishmentSuggestion
} from '$lib/domain/replenishment';
import type { InventoryService } from './inventory.service';
import type { ShoppingListService } from './shopping-list.service';
import {
	type IPurchasePatternRepository,
	purchasePatternLookbackDate
} from '$lib/infrastructure/repositories/purchase-pattern.repository';
import type { StorageLocation } from '$lib/domain/location';
import { generateId } from '$lib/infrastructure/auth/id';

export class PurchasePatternReadOnlyError extends Error {
	constructor() {
		super('Du har endast läsbehörighet i detta hushåll.');
		this.name = 'PurchasePatternReadOnlyError';
	}
}

export class PurchasePatternNotFoundError extends Error {
	constructor() {
		super('Suggestion not found');
		this.name = 'PurchasePatternNotFoundError';
	}
}

export class PurchasePatternService {
	constructor(
		private readonly repository: IPurchasePatternRepository,
		private readonly inventoryService: InventoryService,
		private readonly shoppingListService: ShoppingListService
	) {}

	async recordReceiptImport(lines: RecordReceiptPurchaseLineInput[]): Promise<void> {
		await this.repository.insertLines(lines);
	}

	async recordCheckoffPurchaseLine(input: {
		householdId: string;
		userId: string;
		productName: string;
		location: StorageLocation;
		quantity: string | null;
		unit: string | null;
		inventoryItemId: string;
	}): Promise<void> {
		const productName = input.productName.trim();
		if (!productName) return;

		const normalizedKey = normalizeReceiptProductName(productName);
		await this.repository.insertLines([
			{
				householdId: input.householdId,
				userId: input.userId,
				importBatchId: generateId(),
				productName,
				location: input.location,
				quantity: input.quantity,
				unit: input.unit,
				purchasedAt: new Date(),
				lineIndex: 0,
				importSource: 'shopping_checkoff',
				inventoryItemId: input.inventoryItemId,
				matchSource: 'inventory_item',
				conceptKey: normalizedKey
			}
		]);
	}

	async getReplenishmentSuggestions(householdId: string): Promise<ReplenishmentSuggestion[]> {
		const since = purchasePatternLookbackDate();
		const [lines, dismissedKeys, inventoryKeys, listNames] = await Promise.all([
			this.repository.listRecentLines(householdId, since),
			this.repository.listDismissedKeys(householdId),
			this.repository.listInventoryNormalizedKeys(householdId),
			this.repository.listShoppingListNormalizedNames(householdId)
		]);

		return detectReplenishmentSuggestions(lines, inventoryKeys, listNames, dismissedKeys);
	}

	async getHouseholdShoppingCadence(householdId: string): Promise<HouseholdShoppingCadence | null> {
		const since = purchasePatternLookbackDate();
		const lines = await this.repository.listRecentLines(householdId, since);
		return deriveHouseholdShoppingCadence(lines);
	}

	async getDedupeContext(householdId: string) {
		const since = purchasePatternLookbackDate();
		const [recentLines, listNormalizedNames] = await Promise.all([
			this.repository.listRecentLines(householdId, since),
			this.repository.listShoppingListNormalizedNames(householdId)
		]);

		return { recentLines, listNormalizedNames };
	}

	async acceptReplenishmentToList(
		householdId: string,
		role: HouseholdRole,
		normalizedKey: string
	): Promise<{ name: string }> {
		if (!canEditInventory(role)) {
			throw new PurchasePatternReadOnlyError();
		}

		const suggestions = await this.getReplenishmentSuggestions(householdId);
		const suggestion = suggestions.find((entry) => entry.normalizedKey === normalizedKey);
		if (!suggestion) {
			throw new PurchasePatternNotFoundError();
		}

		await this.shoppingListService.addItem(householdId, role, {
			name: suggestion.displayName,
			quantity: suggestion.quantity,
			unit: suggestion.unit
		});

		return { name: suggestion.displayName };
	}

	async getSuggestions(householdId: string): Promise<ReceiptPatternSuggestion[]> {
		const since = purchasePatternLookbackDate();
		const [lines, dismissedKeys, inventoryKeys] = await Promise.all([
			this.repository.listRecentLines(householdId, since),
			this.repository.listDismissedKeys(householdId),
			this.repository.listInventoryNormalizedKeys(householdId)
		]);

		return detectReceiptPatternSuggestions(lines, inventoryKeys, dismissedKeys);
	}

	async getFinishSuggestions(householdId: string): Promise<ReceiptFinishSuggestion[]> {
		const since = purchasePatternLookbackDate();
		const [lines, dismissedKeys, inventoryItems] = await Promise.all([
			this.repository.listRecentLines(householdId, since),
			this.repository.listDismissedKeys(householdId),
			this.repository.listActiveInventoryMatches(householdId)
		]);

		return detectReceiptFinishSuggestions(lines, inventoryItems, dismissedKeys);
	}

	async acceptSuggestion(
		householdId: string,
		userId: string,
		role: HouseholdRole,
		normalizedKey: string
	): Promise<{ name: string }> {
		if (!canEditInventory(role)) {
			throw new PurchasePatternReadOnlyError();
		}

		const suggestions = await this.getSuggestions(householdId);
		const suggestion = suggestions.find((entry) => entry.normalizedKey === normalizedKey);
		if (!suggestion) {
			throw new PurchasePatternNotFoundError();
		}

		await this.inventoryService.createItem(
			householdId,
			userId,
			{
				name: suggestion.displayName,
				location: suggestion.location,
				quantity: suggestion.quantity,
				unit: suggestion.unit,
				expiresOn: null,
				notes: null
			},
			role
		);

		return { name: suggestion.displayName };
	}

	async dismissSuggestion(
		householdId: string,
		role: HouseholdRole,
		normalizedKey: string
	): Promise<void> {
		if (!canEditInventory(role)) {
			throw new PurchasePatternReadOnlyError();
		}

		const key = normalizeReceiptProductName(normalizedKey);
		if (!key) {
			throw new PurchasePatternNotFoundError();
		}

		await this.repository.dismissPattern(householdId, key);
	}

	async acceptFinishSuggestion(
		householdId: string,
		userId: string,
		role: HouseholdRole,
		inventoryItemId: string
	): Promise<{ name: string }> {
		if (!canEditInventory(role)) {
			throw new PurchasePatternReadOnlyError();
		}

		const suggestions = await this.getFinishSuggestions(householdId);
		const suggestion = suggestions.find((entry) => entry.inventoryItemId === inventoryItemId);
		if (!suggestion) {
			throw new PurchasePatternNotFoundError();
		}

		await this.inventoryService.markAsFinished(householdId, inventoryItemId, userId, role);
		return { name: suggestion.displayName };
	}

	async dismissFinishSuggestion(
		householdId: string,
		role: HouseholdRole,
		inventoryItemId: string
	): Promise<void> {
		if (!canEditInventory(role)) {
			throw new PurchasePatternReadOnlyError();
		}

		const suggestions = await this.getFinishSuggestions(householdId);
		if (!suggestions.some((entry) => entry.inventoryItemId === inventoryItemId)) {
			throw new PurchasePatternNotFoundError();
		}

		await this.repository.dismissPattern(householdId, receiptFinishDismissKey(inventoryItemId));
	}
}
