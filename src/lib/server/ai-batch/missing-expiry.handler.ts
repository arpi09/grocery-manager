import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import { batchCustomId } from '$lib/domain/ai-batch';
import { formatTodayIso } from '$lib/domain/learning/shelf-life-learning';
import type { StorageLocation } from '$lib/domain/location';
import { RECEIPT_SHELF_LIFE_BATCH_SCHEMA } from '$lib/server/receipt-shelf-life-predictions';
import { buildStructuredRequestBody, OPENAI_MODEL_NANO } from '$lib/server/openai';
import { isReceiptAiBatchEnabled } from '$lib/server/feature-flags';
import {
	buildMissingExpiryBatchUserPrompt,
	MISSING_EXPIRY_BATCH_MAX,
	MISSING_EXPIRY_SCHEMA_NAME,
	MISSING_EXPIRY_SYSTEM_PROMPT,
	parseMissingExpiryEstimates
} from '$lib/server/missing-expiry-batch';
import type { AiBatchApplyResult, AiBatchCollectResult, AiBatchKindHandler } from './types';
import { isUsableOutputLine } from './types';
import type { BatchOutputLine, BatchRequestLine } from '$lib/server/openai-batch';

/** Bound one run: at most this many items, MISSING_EXPIRY_BATCH_MAX per request. */
const MAX_ITEMS_PER_RUN = 400;

interface TargetRow {
	index: number;
	itemId: string;
}

interface MissingExpiryPayload {
	todayIso: string;
	targets: Record<string, TargetRow[]>;
}

/**
 * Pre-fills bäst-före dates for active pantry items missing expiry, across all
 * households, nightly via Batch API. Idempotent: apply only writes items still
 * missing expiry. The interactive `inferMissingExpiryBatch` sync path stays as
 * the immediate fallback for freshly-added items.
 */
export const missingExpiryBatchHandler: AiBatchKindHandler = {
	kind: 'missing_expiry',
	minResubmitHours: 6,

	isEnabled: () => isReceiptAiBatchEnabled(),

	async collect(): Promise<AiBatchCollectResult | null> {
		const items = await db
			.select({
				id: inventoryItemTable.id,
				name: inventoryItemTable.name,
				location: inventoryItemTable.location
			})
			.from(inventoryItemTable)
			.where(and(isNull(inventoryItemTable.expiresOn), sql`${inventoryItemTable.quantity}::numeric > 0`))
			.orderBy(inventoryItemTable.householdId)
			.limit(MAX_ITEMS_PER_RUN);

		if (items.length === 0) {
			return null;
		}

		const todayIso = formatTodayIso();
		const lines: BatchRequestLine[] = [];
		const targets: Record<string, TargetRow[]> = {};

		for (let start = 0; start < items.length; start += MISSING_EXPIRY_BATCH_MAX) {
			const chunk = items.slice(start, start + MISSING_EXPIRY_BATCH_MAX);
			const customId = batchCustomId('missing_expiry', lines.length);
			const rows = chunk.map((item, index) => ({
				index,
				itemId: item.id,
				name: item.name,
				location: item.location as StorageLocation
			}));
			targets[customId] = rows.map((row) => ({ index: row.index, itemId: row.itemId }));
			lines.push({
				customId,
				body: buildStructuredRequestBody({
					model: OPENAI_MODEL_NANO,
					systemPrompt: MISSING_EXPIRY_SYSTEM_PROMPT,
					userPrompt: buildMissingExpiryBatchUserPrompt(rows, todayIso),
					schemaName: MISSING_EXPIRY_SCHEMA_NAME,
					schema: RECEIPT_SHELF_LIFE_BATCH_SCHEMA
				})
			});
		}

		const payload: MissingExpiryPayload = { todayIso, targets };
		return { lines, payload: payload as unknown as Record<string, unknown> };
	},

	async apply(
		lines: BatchOutputLine[],
		rawPayload: Record<string, unknown>
	): Promise<AiBatchApplyResult> {
		const payload = rawPayload as unknown as MissingExpiryPayload;
		const todayIso = payload.todayIso ?? formatTodayIso();
		let applied = 0;

		for (const line of lines) {
			if (!isUsableOutputLine(line) || line.json === null) continue;
			const rows = payload.targets?.[line.customId];
			if (!rows || rows.length === 0) continue;

			const estimates = parseMissingExpiryEstimates(line.json, rows, todayIso);
			for (const estimate of estimates) {
				// Guard: only fill items STILL missing expiry (idempotent, no clobber).
				const updated = await db
					.update(inventoryItemTable)
					.set({ expiresOn: estimate.expiresOn, expiresOnSource: 'ai_inferred' })
					.where(
						and(
							eq(inventoryItemTable.id, estimate.itemId),
							isNull(inventoryItemTable.expiresOn),
							sql`${inventoryItemTable.quantity}::numeric > 0`
						)
					)
					.returning();
				applied += updated.length;
			}
		}

		return { applied, result: { applied } };
	}
};
