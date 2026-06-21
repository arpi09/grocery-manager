import {
	buildLastNWeekBars,
	startOfWeek,
	toIsoDate,
	type WeeklyBar
} from '$lib/domain/statistik';

export interface ReceiptSpendLine {
	purchasedAt: Date;
	lineTotalSek: number | null;
	unitPriceSek: number | null;
	quantity: number | null;
	storeLabel: string | null;
	importBatchId: string;
}

export interface ReceiptSpendReport {
	hasData: boolean;
	currency: 'SEK';
	thisMonthSek: number;
	lastMonthSek: number | null;
	monthDeltaSek: number | null;
	tripCountThisMonth: number;
	pricedLineRatio: number | null;
	weeklySpend: WeeklyBar[];
	topStores: { storeLabel: string; sek: number }[];
}

const TREND_WEEKS = 4;
const LOOKBACK_DAYS = 90;

function parseNumeric(value: string | number | null | undefined): number | null {
	if (value == null) return null;
	const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

/** Resolve line amount in SEK before rounding (pure). */
export function resolveLineAmountSek(line: Pick<
	ReceiptSpendLine,
	'lineTotalSek' | 'unitPriceSek' | 'quantity'
>): number | null {
	const lineTotal = line.lineTotalSek;
	if (lineTotal != null && lineTotal > 0) {
		return lineTotal;
	}

	const unitPrice = line.unitPriceSek;
	if (unitPrice == null) {
		return null;
	}

	const quantity = line.quantity;
	if (quantity != null) {
		return unitPrice * quantity;
	}

	return unitPrice;
}

export function roundSekForDisplay(amount: number): number {
	return Math.round(amount);
}

function startOfMonthUtc(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isInMonth(effectiveDate: Date, monthStart: Date): boolean {
	const nextMonth = new Date(monthStart);
	nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
	return effectiveDate >= monthStart && effectiveDate < nextMonth;
}

export function buildReceiptSpendReport(
	lines: ReceiptSpendLine[],
	referenceDate: Date = new Date()
): ReceiptSpendReport {
	const since = new Date(referenceDate);
	since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

	const windowLines = lines.filter((line) => line.purchasedAt >= since);
	const hasData = windowLines.length > 0;

	if (!hasData) {
		return {
			hasData: false,
			currency: 'SEK',
			thisMonthSek: 0,
			lastMonthSek: null,
			monthDeltaSek: null,
			tripCountThisMonth: 0,
			pricedLineRatio: null,
			weeklySpend: buildLastNWeekBars([], TREND_WEEKS, referenceDate),
			topStores: []
		};
	}

	const currentMonthStart = startOfMonthUtc(referenceDate);
	const lastMonthStart = new Date(currentMonthStart);
	lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);

	let thisMonthRaw = 0;
	let lastMonthRaw = 0;
	let pricedLines = 0;
	const tripBatches = new Set<string>();
	const storeTotals = new Map<string, number>();
	const weeklyCounts: { weekStart: string; count: number }[] = [];
	const weekIndex = new Map<string, number>();

	for (const line of windowLines) {
		const effectiveDate = line.purchasedAt;
		const amount = resolveLineAmountSek(line);

		if (amount != null) {
			pricedLines += 1;
			const rounded = roundSekForDisplay(amount);

			if (isInMonth(effectiveDate, currentMonthStart)) {
				thisMonthRaw += amount;
			}
			if (isInMonth(effectiveDate, lastMonthStart)) {
				lastMonthRaw += amount;
			}

			const weekStartIso = toIsoDate(startOfWeek(effectiveDate));
			const existingIndex = weekIndex.get(weekStartIso);
			if (existingIndex != null) {
				weeklyCounts[existingIndex].count += rounded;
			} else {
				weekIndex.set(weekStartIso, weeklyCounts.length);
				weeklyCounts.push({ weekStart: weekStartIso, count: rounded });
			}

			const store = line.storeLabel?.trim();
			if (store) {
				storeTotals.set(store, (storeTotals.get(store) ?? 0) + rounded);
			}
		}

		if (isInMonth(effectiveDate, currentMonthStart)) {
			tripBatches.add(line.importBatchId);
		}
	}

	const thisMonthSek = roundSekForDisplay(thisMonthRaw);
	const lastMonthSek = roundSekForDisplay(lastMonthRaw);
	const hasLastMonth = windowLines.some((line) => isInMonth(line.purchasedAt, lastMonthStart));

	const weeklySpend = buildLastNWeekBars(weeklyCounts, TREND_WEEKS, referenceDate);

	const topStores = [...storeTotals.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([storeLabel, sek]) => ({ storeLabel, sek }));

	return {
		hasData: true,
		currency: 'SEK',
		thisMonthSek,
		lastMonthSek: hasLastMonth ? lastMonthSek : null,
		monthDeltaSek: hasLastMonth ? thisMonthSek - lastMonthSek : null,
		tripCountThisMonth: tripBatches.size,
		pricedLineRatio: windowLines.length > 0 ? pricedLines / windowLines.length : null,
		weeklySpend,
		topStores
	};
}

export function mapReceiptPurchaseRowToSpendLine(row: {
	purchasedAt: Date | null;
	createdAt: Date;
	lineTotal: string | null;
	unitPrice: string | null;
	quantity: string | null;
	storeLabel: string | null;
	importBatchId: string;
}): ReceiptSpendLine {
	return {
		purchasedAt: row.purchasedAt ?? row.createdAt,
		lineTotalSek: parseNumeric(row.lineTotal),
		unitPriceSek: parseNumeric(row.unitPrice),
		quantity: parseNumeric(row.quantity),
		storeLabel: row.storeLabel,
		importBatchId: row.importBatchId
	};
}

/** Safe fallback when spend data is missing or failed to load. */
export const EMPTY_RECEIPT_SPEND_REPORT: ReceiptSpendReport = buildReceiptSpendReport([]);
