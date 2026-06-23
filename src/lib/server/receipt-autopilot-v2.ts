import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import type { HouseholdShelfLifeRule } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import type { HouseholdLocationRule } from '$lib/infrastructure/repositories/household-location-rule.repository';

export const RECEIPT_AUTOPILOT_V2_CONFIDENCE_MIN = 0.9;

export interface ReceiptAutopilotV2Context {
	shelfLifeRules: HouseholdShelfLifeRule[];
	locationRules: HouseholdLocationRule[];
}

export interface ReceiptAutopilotV2LineSelection {
	index: number;
	line: ReceiptLine;
	normalizedKey: string;
	reason: 'shelf_life_rule' | 'location_rule';
}

function hasLearnedRule(
	normalizedKey: string,
	location: ReceiptLine['location'],
	ctx: ReceiptAutopilotV2Context
): ReceiptAutopilotV2LineSelection['reason'] | null {
	const shelfRule = ctx.shelfLifeRules.find(
		(rule) => rule.normalizedKey === normalizedKey && rule.location === location && rule.sampleCount >= 2
	);
	if (shelfRule) return 'shelf_life_rule';

	const locationRule = ctx.locationRules.find(
		(rule) => rule.normalizedKey === normalizedKey && rule.sampleCount >= 2
	);
	if (locationRule) return 'location_rule';

	return null;
}

export function selectReceiptAutopilotV2Lines(
	lines: ReceiptLine[],
	shelfLifePredictions: Array<ReceiptShelfLifePrediction | null | undefined>,
	ctx: ReceiptAutopilotV2Context
): ReceiptAutopilotV2LineSelection[] {
	const selected: ReceiptAutopilotV2LineSelection[] = [];

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const name = line.name.trim();
		if (!name) continue;

		const confidence = line.confidence ?? null;
		if (confidence == null || confidence < RECEIPT_AUTOPILOT_V2_CONFIDENCE_MIN) continue;

		const reason = hasLearnedRule(normalizeReceiptProductName(name), line.location, ctx);
		if (!reason) continue;

		selected.push({ index, line, normalizedKey: normalizeReceiptProductName(name), reason });
	}

	return selected;
}

export function partitionReceiptLinesForAutopilotV2(
	lines: ReceiptLine[],
	shelfLifePredictions: Array<ReceiptShelfLifePrediction | null | undefined>,
	ctx: ReceiptAutopilotV2Context
): { autoImport: ReceiptLine[]; review: ReceiptLine[]; autoImportIndices: number[] } {
	const selections = selectReceiptAutopilotV2Lines(lines, shelfLifePredictions, ctx);
	const autoImportIndices = new Set(selections.map((entry) => entry.index));
	const autoImport: ReceiptLine[] = [];
	const review: ReceiptLine[] = [];

	for (let index = 0; index < lines.length; index++) {
		if (autoImportIndices.has(index)) {
			autoImport.push(lines[index]);
		} else {
			review.push(lines[index]);
		}
	}

	return { autoImport, review, autoImportIndices: [...autoImportIndices] };
}
