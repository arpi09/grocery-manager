import { and, desc, eq, gte, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { ReceiptSpendLine } from '$lib/domain/receipt-spend';
import { mapReceiptPurchaseRowToSpendLine } from '$lib/domain/receipt-spend';
import type {
	LastPaidPrice,
	MatchedLevel,
	PurchaseMemorySearchResult,
	PurchaseMemorySummary,
	PurchaseMemoryTimelineEntry
} from '$lib/domain/price-memory';
import { PRICE_MEMORY_WINDOW_DAYS } from '$lib/domain/price-memory';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import {
	householdPurchaseConceptTable,
	receiptPurchaseLineTable
} from '$lib/infrastructure/db/schema';

type Row = typeof receiptPurchaseLineTable.$inferSelect;

export interface IPriceMemoryRepository {
	getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null>;
	getSummaryByInventoryItemId(
		householdId: string,
		inventoryItemId: string
	): Promise<PurchaseMemorySummary | null>;
	getSummaryByKey(householdId: string, normalizedKey: string): Promise<PurchaseMemorySummary | null>;
	getSummaryByConceptKey(
		householdId: string,
		conceptKey: string
	): Promise<PurchaseMemorySummary | null>;
	getTimelineByKey(
		householdId: string,
		normalizedKey: string
	): Promise<PurchaseMemoryTimelineEntry[]>;
	getTimelineByConceptKey(
		householdId: string,
		conceptKey: string
	): Promise<PurchaseMemoryTimelineEntry[]>;
	search(householdId: string, query: string, limit?: number): Promise<PurchaseMemorySearchResult[]>;
	listSpendLinesSince(householdId: string, since: Date): Promise<ReceiptSpendLine[]>;
}

function sinceDate(): Date {
	const since = new Date();
	since.setDate(since.getDate() - PRICE_MEMORY_WINDOW_DAYS);
	return since;
}

function at(row: Row): Date {
	return row.purchasedAt ?? row.createdAt;
}

function inWindow(row: Row, since: Date): boolean {
	return at(row) >= since;
}

function windowFilter() {
	const since = sinceDate();
	return or(
		and(isNotNull(receiptPurchaseLineTable.purchasedAt), gte(receiptPurchaseLineTable.purchasedAt, since)),
		and(isNull(receiptPurchaseLineTable.purchasedAt), gte(receiptPurchaseLineTable.createdAt, since))
	);
}

function summaryFrom(
	lines: Row[],
	level: MatchedLevel,
	conceptKey: string,
	normalizedKey: string,
	displayName: string
): PurchaseMemorySummary {
	const since = sinceDate();
	const windowLines = lines.filter((line) => inWindow(line, since));
	const priced = windowLines
		.filter((line) => line.unitPrice)
		.sort((a, b) => at(b).getTime() - at(a).getTime());
	const retailers = new Set(
		windowLines.map((line) => line.storeLabel?.trim()).filter(Boolean) as string[]
	);
	const last = priced[0];
	return {
		displayName,
		matchedLevel: level,
		lastPaid: last
			? {
					normalizedKey: last.normalizedKey,
					unitPrice: last.unitPrice!,
					currency: last.currency ?? 'SEK',
					lineTotal: last.lineTotal,
					storeLabel: last.storeLabel,
					purchasedAt: at(last)
				}
			: null,
		purchaseCount: windowLines.length,
		retailerCount: retailers.size,
		conceptKey,
		normalizedKey
	};
}

export class DrizzlePriceMemoryRepository implements IPriceMemoryRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async getLastPaidPrice(householdId: string, normalizedKey: string): Promise<LastPaidPrice | null> {
		const [row] = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable.normalizedKey, normalizedKey),
					isNotNull(receiptPurchaseLineTable.unitPrice),
					windowFilter()
				)
			)
			.orderBy(desc(sql`COALESCE(${receiptPurchaseLineTable.purchasedAt}, ${receiptPurchaseLineTable.createdAt})`))
			.limit(1);
		if (!row?.unitPrice) return null;
		return {
			normalizedKey: row.normalizedKey,
			unitPrice: row.unitPrice,
			currency: row.currency ?? 'SEK',
			lineTotal: row.lineTotal,
			storeLabel: row.storeLabel,
			purchasedAt: at(row)
		};
	}

	private async loadConceptName(householdId: string, conceptKey: string) {
		const [concept] = await this.database
			.select({ displayName: householdPurchaseConceptTable.displayName })
			.from(householdPurchaseConceptTable)
			.where(
				and(
					eq(householdPurchaseConceptTable.householdId, householdId),
					eq(householdPurchaseConceptTable.conceptKey, conceptKey)
				)
			)
			.limit(1);
		return concept?.displayName;
	}

	async getSummaryByInventoryItemId(householdId: string, inventoryItemId: string) {
		const lines = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable.inventoryItemId, inventoryItemId)
				)
			);
		if (!lines.length) return null;
		const latest = lines[0];
		const conceptKey = latest.conceptKey ?? latest.normalizedKey;
		const displayName = (await this.loadConceptName(householdId, conceptKey)) ?? latest.productName;
		return summaryFrom(lines, 'normalized_product', conceptKey, latest.normalizedKey, displayName);
	}

	async getSummaryByKey(householdId: string, normalizedKey: string) {
		const lines = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable.normalizedKey, normalizedKey)
				)
			);
		if (!lines.length) return null;
		const latest = lines[0];
		const conceptKey = latest.conceptKey ?? normalizedKey;
		const displayName = (await this.loadConceptName(householdId, conceptKey)) ?? latest.productName;
		return summaryFrom(lines, 'normalized_product', conceptKey, normalizedKey, displayName);
	}

	async getSummaryByConceptKey(householdId: string, conceptKey: string) {
		const displayName = await this.loadConceptName(householdId, conceptKey);
		const lines = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable.conceptKey, conceptKey)
				)
			);
		if (!lines.length && !displayName) return null;
		return summaryFrom(
			lines,
			'household_concept',
			conceptKey,
			lines[0]?.normalizedKey ?? conceptKey,
			displayName ?? lines[0]?.productName ?? conceptKey
		);
	}

	private async timelineWhere(
		householdId: string,
		field: 'normalizedKey' | 'conceptKey',
		value: string
	): Promise<PurchaseMemoryTimelineEntry[]> {
		const lines = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					eq(receiptPurchaseLineTable[field], value),
					windowFilter()
				)
			)
			.orderBy(desc(sql`COALESCE(${receiptPurchaseLineTable.purchasedAt}, ${receiptPurchaseLineTable.createdAt})`));
		return lines.map((line) => ({
			purchasedAt: at(line),
			unitPrice: line.unitPrice,
			currency: line.currency ?? 'SEK',
			storeLabel: line.storeLabel,
			productName: line.productName
		}));
	}

	async getTimelineByKey(householdId: string, normalizedKey: string) {
		return this.timelineWhere(householdId, 'normalizedKey', normalizedKey);
	}

	async getTimelineByConceptKey(householdId: string, conceptKey: string) {
		return this.timelineWhere(householdId, 'conceptKey', conceptKey);
	}

	async search(householdId: string, query: string, limit = 10): Promise<PurchaseMemorySearchResult[]> {
		const pattern = `%${query.replace(/\s+/g, '%')}%`;
		const concepts = await this.database
			.select()
			.from(householdPurchaseConceptTable)
			.where(
				and(
					eq(householdPurchaseConceptTable.householdId, householdId),
					ilike(householdPurchaseConceptTable.displayName, pattern)
				)
			)
			.limit(limit);
		const rawLines = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					or(
						ilike(receiptPurchaseLineTable.productName, pattern),
						ilike(receiptPurchaseLineTable.normalizedKey, pattern)
					),
					windowFilter()
				)
			);
		const seen = new Set<string>();
		const results: PurchaseMemorySearchResult[] = [];
		for (const concept of concepts) {
			const summary = await this.getSummaryByConceptKey(householdId, concept.conceptKey);
			if (!summary || seen.has(summary.normalizedKey)) continue;
			seen.add(summary.normalizedKey);
			results.push({
				displayName: summary.displayName,
				matchedLevel: 'household_concept',
				conceptKey: summary.conceptKey,
				normalizedKey: summary.normalizedKey,
				purchaseCount: summary.purchaseCount,
				retailerCount: summary.retailerCount,
				lastPaid: summary.lastPaid
			});
		}
		for (const line of rawLines) {
			if (seen.has(line.normalizedKey)) continue;
			const summary = await this.getSummaryByKey(householdId, line.normalizedKey);
			if (!summary) continue;
			seen.add(line.normalizedKey);
			results.push({
				displayName: summary.displayName,
				matchedLevel: 'normalized_product',
				conceptKey: summary.conceptKey,
				normalizedKey: summary.normalizedKey,
				purchaseCount: summary.purchaseCount,
				retailerCount: summary.retailerCount,
				lastPaid: summary.lastPaid
			});
			if (results.length >= limit) break;
		}
		return results.slice(0, limit);
	}

	async listSpendLinesSince(householdId: string, since: Date): Promise<ReceiptSpendLine[]> {
		const rows = await this.database
			.select()
			.from(receiptPurchaseLineTable)
			.where(
				and(
					eq(receiptPurchaseLineTable.householdId, householdId),
					// Include recent imports even when receipt purchasedAt is older than the lookback.
					or(
						gte(receiptPurchaseLineTable.createdAt, since),
						gte(receiptPurchaseLineTable.purchasedAt, since)
					)
				)
			);
		return rows.map((row) => mapReceiptPurchaseRowToSpendLine(row));
	}
}
