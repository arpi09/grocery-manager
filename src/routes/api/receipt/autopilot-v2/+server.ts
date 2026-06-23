import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import {
	householdLocationRuleRepository,
	householdShelfLifeRuleRepository
} from '$lib/server/di';
import { importReceiptLines } from '$lib/server/receipt-import';
import { partitionReceiptLinesForAutopilotV2 } from '$lib/server/receipt-autopilot-v2';
import { recordProductEvent } from '$lib/server/product-events';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import type { ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
import type { RequestHandler } from './$types';

function parseImportBody(body: unknown): {
	lines: ReceiptLine[];
	shelfLifePredictions?: Array<ReceiptShelfLifePrediction | null>;
	storeLabel?: string | null;
	purchasedAt?: string | null;
} | null {
	if (!body || typeof body !== 'object' || !('lines' in body)) {
		return null;
	}
	const lines = (body as { lines: unknown }).lines;
	if (!Array.isArray(lines) || lines.length === 0) {
		return null;
	}
	const shelfLifePredictions = (body as { shelfLifePredictions?: unknown }).shelfLifePredictions;
	const storeLabelRaw = (body as { storeLabel?: unknown }).storeLabel;
	const purchasedAtRaw = (body as { purchasedAt?: unknown }).purchasedAt;
	return {
		lines: lines as ReceiptLine[],
		shelfLifePredictions: Array.isArray(shelfLifePredictions)
			? (shelfLifePredictions as Array<ReceiptShelfLifePrediction | null>)
			: [],
		storeLabel: typeof storeLabelRaw === 'string' ? storeLabelRaw : null,
		purchasedAt: typeof purchasedAtRaw === 'string' ? purchasedAtRaw : null
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdRole || !canEditInventory(locals.householdRole)) {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const parsed = parseImportBody(await request.json().catch(() => null));
	if (!parsed) {
		return json({ error: translate(locals.locale, 'errors.api.receiptNoItems') }, { status: 400 });
	}

	const [shelfLifeRules, locationRules] = await Promise.all([
		householdShelfLifeRuleRepository.listByHousehold(auth.householdId, 2),
		householdLocationRuleRepository.listByHousehold(auth.householdId, 2)
	]);

	const { autoImport, autoImportIndices } = partitionReceiptLinesForAutopilotV2(
		parsed.lines,
		parsed.shelfLifePredictions ?? [],
		{ shelfLifeRules, locationRules }
	);

	if (autoImport.length === 0) {
		return json({ ok: true, itemsAdded: 0, autoImportIndices: [] });
	}

	const result = await importReceiptLines({
		householdId: auth.householdId,
		userId: auth.user.id,
		role: locals.householdRole,
		lines: autoImport,
		inventoryService: locals.inventoryService,
		purchasePatternService: locals.purchasePatternService,
		pmfService: locals.pmfService,
		learningEngineService: locals.learningEngineService,
		eventType: 'receipt_parsed',
		source: 'manual',
		storeLabel: parsed.storeLabel,
		purchasedAt: parsed.purchasedAt
	});

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		eventType: 'receipt_parsed',
		metadata: {
			lineCount: autoImport.length,
			itemsAdded: result.itemsAdded,
			autopilotV2: true,
			indices: autoImportIndices
		}
	});

	return json({
		ok: true,
		itemsAdded: result.itemsAdded,
		importBatchId: result.importBatchId,
		autoImportIndices
	});
};
