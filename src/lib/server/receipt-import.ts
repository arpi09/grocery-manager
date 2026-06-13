import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { resolveReceiptLineLocation } from '$lib/domain/guess-storage-location';
import type { HouseholdRole } from '$lib/domain/household';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import type { InventoryService } from '$lib/application/inventory.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { generateId } from '$lib/infrastructure/auth/id';
import { receiptLineToInventoryAmount } from '$lib/server/receipt-parse';
import { receiptLineToPurchaseRecord } from '$lib/server/receipt-import-purchase';
import { recordProductEvent } from '$lib/server/product-events';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { inferLineShelfLife } from '$lib/server/shelf-life-line-inference';
import { recordLineShelfLifeFeedback } from '$lib/server/shelf-life-feedback-recording';

export interface ImportReceiptLinesInput {
	householdId: string;
	userId: string;
	role: HouseholdRole;
	lines: ReceiptLine[];
	inventoryService: InventoryService;
	purchasePatternService: PurchasePatternService;
	pmfService: PmfService;
	learningEngineService: LearningEngineService;
	eventType: 'receipt_parsed' | 'kivra_forward_received';
	source?: 'manual' | 'kivra_forward';
	storeLabel?: string | null;
	purchasedAt?: string | Date | null;
}

export interface ImportReceiptLinesResult {
	itemsAdded: number;
	importBatchId: string;
}

function normalizePurchasedAt(purchasedAt: string | Date | null | undefined): string | null {
	if (!purchasedAt) return null;
	if (purchasedAt instanceof Date) return purchasedAt.toISOString().slice(0, 10);
	return purchasedAt;
}

export async function importReceiptLines(
	input: ImportReceiptLinesInput
): Promise<ImportReceiptLinesResult> {
	const importBatchId = generateId();
	const purchaseLines: ReturnType<typeof receiptLineToPurchaseRecord>[] = [];
	const purchasedAt = normalizePurchasedAt(input.purchasedAt);

	let itemsAdded = 0;

	for (const line of input.lines) {
		const name = line.name.trim();
		if (!name) continue;

		const location = line.location ?? resolveReceiptLineLocation(name, line.location);
		const { quantity, unit } = receiptLineToInventoryAmount(line);

		let expiresOn: string | null = null;
		let expiresOnSource: ExpiresOnSource | null = null;
		let predictionForm = {
			predictedExpiresOn: null as string | null,
			predictedTypicalDays: null as number | null,
			modelVersion: null as string | null
		};

		if (isShelfLifeLearningEnabled()) {
			const inferred = await inferLineShelfLife(
				input.learningEngineService,
				input.householdId,
				name,
				location,
				purchasedAt
			);
			if (inferred) {
				expiresOn = inferred.expiresOn;
				expiresOnSource = inferred.expiresOnSource;
				predictionForm = {
					predictedExpiresOn: inferred.expiresOn,
					predictedTypicalDays: inferred.typicalDays,
					modelVersion: inferred.modelVersion
				};
			}
		}

		await input.inventoryService.createItem(
			input.householdId,
			input.userId,
			{
				name,
				location,
				quantity,
				unit,
				expiresOn,
				expiresOnSource,
				notes: null,
				inferExpiry: false
			},
			input.role
		);

		await recordLineShelfLifeFeedback({
			learningEngine: input.learningEngineService,
			householdId: input.householdId,
			userId: input.userId,
			productName: name,
			location,
			purchasedAt,
			importBatchId,
			storeLabel: input.storeLabel ?? null,
			feedbackSource: input.source === 'kivra_forward' ? 'kivra_forward' : 'receipt_scan',
			prediction: predictionForm,
			actualExpiresOn: expiresOn,
			userProvidedExpiresOn: false,
			quantity,
			unit: unit ?? null,
			unitPrice: line.unitPrice ?? null
		});

		purchaseLines.push(
			receiptLineToPurchaseRecord({
				householdId: input.householdId,
				userId: input.userId,
				importBatchId,
				line,
				location,
				quantity,
				unit: unit ?? null,
				storeLabel: input.storeLabel,
				purchasedAt: input.purchasedAt
			})
		);
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
