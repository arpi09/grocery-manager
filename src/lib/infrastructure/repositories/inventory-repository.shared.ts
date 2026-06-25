import { and, gt, isNull, lt, lte, or, sql } from 'drizzle-orm';
import {
	autoExpiredCutoffDate,
	normalizeAutoExpiredGraceDays,
	resolveEffectiveAutoExpiredGraceDays
} from '$lib/domain/auto-expired';
import { stalenessCutoffDate } from '$lib/domain/inventory-staleness';
import type { StorageLocation } from '$lib/domain/location';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import type { InventoryListContext } from './inventory.repository';

export function activeQuantityFilter() {
	return gt(inventoryItemTable.quantity, '0');
}

function proportionalCutoffs(context: InventoryListContext) {
	const base = normalizeAutoExpiredGraceDays(context.graceDays);
	const sampleItem = (source: InventoryItem['expiresOnSource'], location: StorageLocation) => ({
		expiresOnSource: source,
		location
	});
	return {
		base: autoExpiredCutoffDate(base),
		defaultHeuristic: autoExpiredCutoffDate(
			resolveEffectiveAutoExpiredGraceDays(base, sampleItem('default_heuristic', 'fridge'))
		),
		aiInferred: autoExpiredCutoffDate(
			resolveEffectiveAutoExpiredGraceDays(base, sampleItem('ai_inferred', 'fridge'))
		),
		heuristic: autoExpiredCutoffDate(
			resolveEffectiveAutoExpiredGraceDays(base, sampleItem('heuristic', 'fridge'))
		)
	};
}

export function autoExpiredFilter(context: InventoryListContext) {
	const cutoffs = proportionalCutoffs(context);
	return and(
		activeQuantityFilter(),
		sql`${inventoryItemTable.expiresOn} is not null`,
		or(
			and(
				sql`${inventoryItemTable.expiresOnSource} = 'default_heuristic'`,
				lte(inventoryItemTable.expiresOn, cutoffs.defaultHeuristic)
			),
			and(
				sql`${inventoryItemTable.expiresOnSource} = 'ai_inferred'`,
				lte(inventoryItemTable.expiresOn, cutoffs.aiInferred)
			),
			and(
				sql`${inventoryItemTable.expiresOnSource} = 'heuristic'`,
				lte(inventoryItemTable.expiresOn, cutoffs.heuristic)
			),
			and(
				sql`(${inventoryItemTable.expiresOnSource} is null or ${inventoryItemTable.expiresOnSource} in ('user_set', 'receipt_printed', 'household_learned'))`,
				lte(inventoryItemTable.expiresOn, cutoffs.base)
			)
		)
	);
}

export function activeNotAutoExpiredFilter(context: InventoryListContext) {
	const cutoffs = proportionalCutoffs(context);
	return and(
		activeQuantityFilter(),
		sql`(
			${inventoryItemTable.expiresOn} is null
			or (
				${inventoryItemTable.expiresOnSource} = 'default_heuristic'
				and ${inventoryItemTable.expiresOn} > ${cutoffs.defaultHeuristic}
			)
			or (
				${inventoryItemTable.expiresOnSource} = 'ai_inferred'
				and ${inventoryItemTable.expiresOn} > ${cutoffs.aiInferred}
			)
			or (
				${inventoryItemTable.expiresOnSource} = 'heuristic'
				and ${inventoryItemTable.expiresOn} > ${cutoffs.heuristic}
			)
			or (
				(${inventoryItemTable.expiresOnSource} is null or ${inventoryItemTable.expiresOnSource} in ('user_set', 'receipt_printed', 'household_learned'))
				and ${inventoryItemTable.expiresOn} > ${cutoffs.base}
			)
		)`
	);
}

export function isMissingLastConfirmedColumn(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	const cause =
		error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
	const combined = `${message} ${cause}`;
	return /column .*last_confirmed_at.* does not exist/i.test(combined);
}

export function staleUndatedFilter(referenceDate = new Date()) {
	const cutoff = stalenessCutoffDate(undefined, referenceDate);
	return and(
		activeQuantityFilter(),
		isNull(inventoryItemTable.expiresOn),
		lt(inventoryItemTable.lastConfirmedAt, cutoff)
	);
}

export function mapInventoryRow(row: typeof inventoryItemTable.$inferSelect): InventoryItem {
	return {
		id: row.id,
		householdId: row.householdId,
		userId: row.userId,
		name: row.name,
		location: row.location as StorageLocation,
		quantity: row.quantity,
		unit: row.unit,
		expiresOn: row.expiresOn,
		expiresOnSource: row.expiresOnSource as InventoryItem['expiresOnSource'],
		notes: row.notes,
		barcode: row.barcode,
		lastConfirmedAt: row.lastConfirmedAt ?? row.createdAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function addDaysIso(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}
