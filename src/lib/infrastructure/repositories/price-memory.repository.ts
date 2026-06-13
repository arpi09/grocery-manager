import { and, desc, eq, gte, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { LastPaidPrice } from '$lib/domain/price-memory';
import { PRICE_MEMORY_WINDOW_DAYS } from '$lib/domain/price-memory';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { receiptPurchaseLineTable } from '$lib/infrastructure/db/schema';

export interface IPriceMemoryRepository {
	getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null>;
}

export class DrizzlePriceMemoryRepository implements IPriceMemoryRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null> {
		const since = new Date();
		since.setDate(since.getDate() - PRICE_MEMORY_WINDOW_DAYS);

		const [row] = await this.database
			.select({
				normalizedKey: receiptPurchaseLineTable.normalizedKey,
				unitPrice: receiptPurchaseLineTable.unitPrice,
				currency: receiptPurchaseLineTable.currency,
				lineTotal: receiptPurchaseLineTable.lineTotal,
				storeLabel: receiptPurchaseLineTable.storeLabel,
				purchasedAt: receiptPurchaseLineTable.purchasedAt,
				createdAt: receiptPurchaseLineTable.createdAt
			})
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable.normalizedKey, normalizedKey),
					isNotNull(receiptPurchaseLineTable.unitPrice),
					or(
						and(
							isNotNull(receiptPurchaseLineTable.purchasedAt),
							gte(receiptPurchaseLineTable.purchasedAt, since)
						),
						and(
							isNull(receiptPurchaseLineTable.purchasedAt),
							gte(receiptPurchaseLineTable.createdAt, since)
						)
					)
				)
			)
			.orderBy(desc(sql`COALESCE(${receiptPurchaseLineTable.purchasedAt}, ${receiptPurchaseLineTable.createdAt})`))
			.limit(1);

		if (!row?.unitPrice) {
			return null;
		}

		return {
			normalizedKey: row.normalizedKey,
			unitPrice: row.unitPrice,
			currency: row.currency ?? 'SEK',
			lineTotal: row.lineTotal,
			storeLabel: row.storeLabel,
			purchasedAt: row.purchasedAt ?? row.createdAt
		};
	}
}
