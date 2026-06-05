import { and, gt, lte, sql } from 'drizzle-orm';
import { autoExpiredCutoffDate } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { inventoryItemTable } from '$lib/infrastructure/db/schema';
import type { InventoryListContext } from './inventory.repository';

export function activeQuantityFilter() {
	return gt(inventoryItemTable.quantity, '0');
}

export function autoExpiredFilter(context: InventoryListContext) {
	const cutoff = autoExpiredCutoffDate(context.graceDays);
	return and(
		activeQuantityFilter(),
		sql`${inventoryItemTable.expiresOn} is not null`,
		lte(inventoryItemTable.expiresOn, cutoff)
	);
}

export function activeNotAutoExpiredFilter(context: InventoryListContext) {
	const cutoff = autoExpiredCutoffDate(context.graceDays);
	return and(
		activeQuantityFilter(),
		sql`(${inventoryItemTable.expiresOn} is null or ${inventoryItemTable.expiresOn} > ${cutoff})`
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
