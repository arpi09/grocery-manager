import { and, eq, gt, gte } from 'drizzle-orm';
import type { StorageLocation } from '$lib/domain/location';
import {
	normalizeReceiptProductName,
	RECEIPT_PATTERN_WINDOW_DAYS,
	type PantryInventoryMatch,
	type RecordReceiptPurchaseLineInput,
	type ReceiptPurchaseLineRecord
} from '$lib/domain/purchase-pattern';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import {
	householdPurchaseConceptTable,
	inventoryItemTable,
	receiptPatternDismissalTable,
	receiptPurchaseLineTable,
	shoppingListItemTable
} from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';

export interface IPurchasePatternRepository {
	insertLines(lines: RecordReceiptPurchaseLineInput[]): Promise<void>;
	listRecentLines(householdId: string, since: Date): Promise<ReceiptPurchaseLineRecord[]>;
	listDismissedKeys(householdId: string): Promise<Set<string>>;
	dismissPattern(householdId: string, normalizedKey: string): Promise<void>;
	restoreDismissal(householdId: string, normalizedKey: string): Promise<boolean>;
	listInventoryNormalizedKeys(householdId: string): Promise<Set<string>>;
	listActiveInventoryMatches(householdId: string): Promise<PantryInventoryMatch[]>;
	listShoppingListNormalizedNames(householdId: string): Promise<Set<string>>;
	countReceiptLines(householdId: string): Promise<number>;
}

function mapLine(row: typeof receiptPurchaseLineTable.$inferSelect): ReceiptPurchaseLineRecord {
	return {
		id: row.id,
		householdId: row.householdId,
		userId: row.userId,
		importBatchId: row.importBatchId,
		productName: row.productName,
		normalizedKey: row.normalizedKey,
		barcode: row.barcode,
		location: row.location as StorageLocation,
		quantity: row.quantity,
		unit: row.unit,
		unitPrice: row.unitPrice,
		currency: row.currency,
		lineTotal: row.lineTotal,
		storeLabel: row.storeLabel,
		purchasedAt: row.purchasedAt,
		inventoryItemId: row.inventoryItemId,
		conceptKey: row.conceptKey ?? row.normalizedKey,
		matchSource: (row.matchSource as ReceiptPurchaseLineRecord['matchSource']) ?? null,
		importSource: (row.importSource as ReceiptPurchaseLineRecord['importSource']) ?? 'unknown',
		lineIndex: row.lineIndex,
		createdAt: row.createdAt
	};
}

export class DrizzlePurchasePatternRepository implements IPurchasePatternRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async insertLines(lines: RecordReceiptPurchaseLineInput[]): Promise<void> {
		if (lines.length === 0) return;

		await this.database
			.insert(receiptPurchaseLineTable)
			.values(
				lines.map((line) => {
					const normalizedKey = normalizeReceiptProductName(line.productName);
					const conceptKey = line.conceptKey ?? normalizedKey;
					return {
						id: generateId(),
						householdId: line.householdId,
						userId: line.userId,
						importBatchId: line.importBatchId,
						productName: line.productName.trim(),
						normalizedKey,
						barcode: line.barcode ?? null,
						location: line.location,
						quantity: line.quantity ?? null,
						unit: line.unit ?? null,
						unitPrice: line.unitPrice ?? null,
						currency: line.currency ?? 'SEK',
						lineTotal: line.lineTotal ?? null,
						storeLabel: line.storeLabel ?? null,
						purchasedAt: line.purchasedAt ?? null,
						inventoryItemId: line.inventoryItemId ?? null,
						conceptKey,
						matchSource: line.matchSource ?? null,
						importSource: line.importSource ?? 'unknown',
						lineIndex: line.lineIndex ?? 0
					};
				})
			)
			.onConflictDoNothing({
				target: [receiptPurchaseLineTable.importBatchId, receiptPurchaseLineTable.lineIndex]
			});

		for (const line of lines) {
			const conceptKey = line.conceptKey ?? normalizeReceiptProductName(line.productName);
			if (!conceptKey) continue;
			await this.database
				.insert(householdPurchaseConceptTable)
				.values({
					householdId: line.householdId,
					conceptKey,
					displayName: line.productName.trim()
				})
				.onConflictDoUpdate({
					target: [
						householdPurchaseConceptTable.householdId,
						householdPurchaseConceptTable.conceptKey
					],
					set: { displayName: line.productName.trim() }
				});
		}
	}

	async listRecentLines(householdId: string, since: Date): Promise<ReceiptPurchaseLineRecord[]> {
		const rows = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					gte(receiptPurchaseLineTable.createdAt, since)
				)
			);

		return rows.map(mapLine);
	}

	async listDismissedKeys(householdId: string): Promise<Set<string>> {
		const rows = await this.database
			.select({ normalizedKey: receiptPatternDismissalTable.normalizedKey })
			.from(receiptPatternDismissalTable)
			.where(eq(receiptPatternDismissalTable.householdId, householdId));

		return new Set(rows.map((row) => row.normalizedKey));
	}

	async dismissPattern(householdId: string, normalizedKey: string): Promise<void> {
		await this.database
			.insert(receiptPatternDismissalTable)
			.values({ householdId, normalizedKey })
			.onConflictDoNothing();
	}

	async restoreDismissal(householdId: string, normalizedKey: string): Promise<boolean> {
		const deleted = await this.database
			.delete(receiptPatternDismissalTable)
			.where(
				and(
					eq(receiptPatternDismissalTable.householdId, householdId),
					eq(receiptPatternDismissalTable.normalizedKey, normalizedKey)
				)
			)
			.returning({ normalizedKey: receiptPatternDismissalTable.normalizedKey });

		return deleted.length > 0;
	}

	async listInventoryNormalizedKeys(householdId: string): Promise<Set<string>> {
		const rows = await this.database
			.select({ name: inventoryItemTable.name })
			.from(inventoryItemTable)
			.where(eq(inventoryItemTable.householdId, householdId));

		return new Set(rows.map((row) => normalizeReceiptProductName(row.name)));
	}

	async listShoppingListNormalizedNames(householdId: string): Promise<Set<string>> {
		const rows = await this.database
			.select({ name: shoppingListItemTable.name })
			.from(shoppingListItemTable)
			.where(
				and(
					eq(shoppingListItemTable.householdId, householdId),
					eq(shoppingListItemTable.checked, false)
				)
			);

		return new Set(rows.map((row) => normalizeReceiptProductName(row.name)));
	}

	async listActiveInventoryMatches(householdId: string): Promise<PantryInventoryMatch[]> {
		const rows = await this.database
			.select({
				id: inventoryItemTable.id,
				name: inventoryItemTable.name,
				location: inventoryItemTable.location,
				quantity: inventoryItemTable.quantity,
				unit: inventoryItemTable.unit
			})
			.from(inventoryItemTable)
			.where(and(eq(inventoryItemTable.householdId, householdId), gt(inventoryItemTable.quantity, '0')));

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			location: row.location as PantryInventoryMatch['location'],
			quantity: row.quantity,
			unit: row.unit,
			normalizedKey: normalizeReceiptProductName(row.name)
		}));
	}

	async countReceiptLines(householdId: string): Promise<number> {
		const rows = await this.database
			.select({ id: receiptPurchaseLineTable.id })
			.from(receiptPurchaseLineTable)
			.where(eq(receiptPurchaseLineTable.householdId, householdId))
			.limit(1);

		return rows.length;
	}
}

export function purchasePatternLookbackDate(now: Date = new Date()): Date {
	const since = new Date(now);
	since.setDate(since.getDate() - RECEIPT_PATTERN_WINDOW_DAYS);
	return since;
}
