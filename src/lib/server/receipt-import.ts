import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import type { HouseholdRole } from '$lib/domain/household';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import type { StorageLocation } from '$lib/domain/location';
import type { InventoryService } from '$lib/application/inventory.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { PmfService } from '$lib/application/pmf.service';
import { generateId } from '$lib/infrastructure/auth/id';
import { receiptLineToInventoryAmount } from '$lib/server/receipt-parse';
import { recordProductEvent } from '$lib/server/product-events';

export interface ImportReceiptLinesInput {
	householdId: string;
	userId: string;
	role: HouseholdRole;
	lines: ReceiptLine[];
	inventoryService: InventoryService;
	purchasePatternService: PurchasePatternService;
	pmfService: PmfService;
	eventType: 'receipt_parsed' | 'kivra_forward_received';
	source?: 'manual' | 'kivra_forward';
}

export interface ImportReceiptLinesResult {
	itemsAdded: number;
	importBatchId: string;
}

export async function importReceiptLines(
	input: ImportReceiptLinesInput
): Promise<ImportReceiptLinesResult> {
	const importBatchId = generateId();
	const purchaseLines: Array<{
		householdId: string;
		userId: string;
		importBatchId: string;
		productName: string;
		location: StorageLocation;
		quantity: string | null;
		unit: string | null;
	}> = [];

	let itemsAdded = 0;

	for (const line of input.lines) {
		const name = line.name.trim();
		if (!name) continue;

		const location = line.location ?? resolveReceiptLineLocation(name, line.location);
		const { quantity, unit } = receiptLineToInventoryAmount(line);

		await input.inventoryService.createItem(
			input.householdId,
			input.userId,
			{
				name,
				location,
				quantity,
				unit,
				expiresOn: null,
				notes: null
			},
			input.role
		);

		purchaseLines.push({
			householdId: input.householdId,
			userId: input.userId,
			importBatchId,
			productName: name,
			location,
			quantity,
			unit: unit ?? null
		});
		itemsAdded++;
	}

	if (itemsAdded === 0) {
		throw new Error('No valid receipt lines to import');
	}

	if (purchaseLines.length > 0) {
		await input.purchasePatternService.recordReceiptImport(purchaseLines);
	}

	recordProductEvent(input.pmfService, {
		userId: input.userId,
		householdId: input.householdId,
		eventType: input.eventType,
		metadata: {
			itemsAdded,
			lineCount: input.lines.length,
			stage: 'import',
			...(input.source ? { source: input.source } : {})
		}
	});

	return { itemsAdded, importBatchId };
}
