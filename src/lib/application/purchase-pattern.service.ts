import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import {
	detectReceiptFinishSuggestions,
	detectReceiptPatternSuggestions,
	normalizeReceiptProductName,
	receiptFinishDismissKey,
	type ReceiptFinishSuggestion,
	type ReceiptPatternSuggestion,
	type RecordReceiptPurchaseLineInput
} from '$lib/domain/purchase-pattern';
import type { InventoryService } from './inventory.service';
import {
	type IPurchasePatternRepository,
	purchasePatternLookbackDate
} from '$lib/infrastructure/repositories/purchase-pattern.repository';

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
		private readonly inventoryService: InventoryService
	) {}

	async recordReceiptImport(lines: RecordReceiptPurchaseLineInput[]): Promise<void> {
		await this.repository.insertLines(lines);
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
