import type { ReceiptPurchaseLineRecord } from './purchase-pattern';

export const HOUSEHOLD_CADENCE_MIN_TRIPS = 2;
/** Minimum receipt trips before we show weekday hints in home status/chips. */
export const HOUSEHOLD_CADENCE_DISPLAY_MIN_TRIPS = 3;

export function shouldShowCadenceWeekday(
	cadence: HouseholdShoppingCadence | null | undefined
): boolean {
	return cadence != null && cadence.tripCount >= HOUSEHOLD_CADENCE_DISPLAY_MIN_TRIPS;
}

export interface HouseholdShoppingCadence {
	weekday: number;
	storeLabel: string | null;
	tripCount: number;
}

interface ShoppingTrip {
	weekday: number;
	storeLabel: string | null;
}

function tripWeekday(line: ReceiptPurchaseLineRecord): number {
	const when = line.purchasedAt ?? line.createdAt;
	return when.getUTCDay();
}

/** Derive dominant shopping weekday from receipt import batches (no new DB model). */
export function deriveHouseholdShoppingCadence(
	lines: ReceiptPurchaseLineRecord[]
): HouseholdShoppingCadence | null {
	if (lines.length === 0) return null;

	const byBatch = new Map<string, ReceiptPurchaseLineRecord[]>();
	for (const line of lines) {
		const batch = line.importBatchId;
		const bucket = byBatch.get(batch);
		if (bucket) bucket.push(line);
		else byBatch.set(batch, [line]);
	}

	const trips: ShoppingTrip[] = [];
	for (const batchLines of byBatch.values()) {
		const anchor = batchLines.reduce((best, line) => {
			const when = line.purchasedAt ?? line.createdAt;
			const bestWhen = best.purchasedAt ?? best.createdAt;
			return when < bestWhen ? line : best;
		});
		const storeLabel = batchLines.find((l) => l.storeLabel?.trim())?.storeLabel?.trim() ?? null;
		trips.push({ weekday: tripWeekday(anchor), storeLabel });
	}

	if (trips.length < HOUSEHOLD_CADENCE_MIN_TRIPS) return null;

	const weekdayCounts = new Map<number, number>();
	for (const trip of trips) {
		weekdayCounts.set(trip.weekday, (weekdayCounts.get(trip.weekday) ?? 0) + 1);
	}

	let bestWeekday = trips[0].weekday;
	let bestCount = 0;
	for (const [weekday, count] of weekdayCounts) {
		if (count > bestCount) {
			bestCount = count;
			bestWeekday = weekday;
		}
	}

	const storeCounts = new Map<string, number>();
	for (const trip of trips) {
		if (trip.weekday !== bestWeekday || !trip.storeLabel) continue;
		storeCounts.set(trip.storeLabel, (storeCounts.get(trip.storeLabel) ?? 0) + 1);
	}

	let storeLabel: string | null = null;
	let storeBest = 0;
	for (const [label, count] of storeCounts) {
		if (count > storeBest) {
			storeBest = count;
			storeLabel = label;
		}
	}

	return { weekday: bestWeekday, storeLabel, tripCount: trips.length };
}

export function formatCadenceWeekday(weekday: number, locale: 'sv' | 'en'): string {
	const jsDay = weekday === 0 ? 0 : weekday;
	const ref = new Date(Date.UTC(2024, 0, 7 + jsDay));
	return ref.toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', { weekday: 'long' });
}
