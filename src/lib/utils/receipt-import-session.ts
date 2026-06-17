import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { dismissClientToast } from '$lib/utils/client-toast.svelte';
import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
import type { ReceiptLine, ReceiptLocationPrediction, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

export const RECEIPT_IMPORT_JUST_COMPLETED_KEY = 'receipt-import-just-completed';
export const RECEIPT_IMPORT_TOAST_PENDING_KEY = 'receipt-import-toast-pending';

export interface ReceiptImportSummary {
	estimatedDates: number;
	locationCorrections: number;
	rulesImproved: number;
}

export interface ReceiptLocationCounts {
	cupboard: number;
	fridge: number;
	freezer: number;
}

export interface ReceiptImportSessionFlag {
	completedAt: number;
	itemsAdded: number;
	estimatedDates: number;
	locationCorrections: number;
	rulesImproved: number;
	locationCounts: ReceiptLocationCounts;
	estimatedExpiryCount: number;
	dominantLocation?: StorageLocation;
}

export interface ReceiptImportLineContext {
	line: ReceiptLine;
	index: number;
	selected: boolean;
	lineExpiresOn: string;
	lineLocation: StorageLocation;
	locationOverride: boolean;
	shelfLifePrediction: ReceiptShelfLifePrediction | null;
	locationPrediction: ReceiptLocationPrediction | null;
	shelfLifeEstimatesInReceipt: boolean;
}

const EMPTY_LOCATION_COUNTS: ReceiptLocationCounts = {
	cupboard: 0,
	fridge: 0,
	freezer: 0
};

export function aggregateReceiptLocationCounts(
	lines: ReceiptImportLineContext[]
): ReceiptLocationCounts {
	const counts: ReceiptLocationCounts = { ...EMPTY_LOCATION_COUNTS };

	for (const entry of lines) {
		if (!entry.selected) continue;
		counts[entry.lineLocation] += 1;
	}

	return counts;
}

export function dominantStorageLocation(counts: ReceiptLocationCounts): StorageLocation {
	let best: StorageLocation = 'fridge';
	let bestCount = -1;

	for (const location of LOCATIONS) {
		if (counts[location] > bestCount) {
			best = location;
			bestCount = counts[location];
		}
	}

	return best;
}

export function aggregateReceiptImportSummary(lines: ReceiptImportLineContext[]): ReceiptImportSummary {
	let estimatedDates = 0;
	let locationCorrections = 0;
	let rulesImproved = 0;

	for (const entry of lines) {
		if (!entry.selected) continue;

		const userExpiry = entry.lineExpiresOn.trim();
		const predictedExpiry = entry.shelfLifePrediction?.expiresOn ?? '';
		const usedEstimatedDate =
			entry.shelfLifeEstimatesInReceipt &&
			predictedExpiry.length > 0 &&
			(!userExpiry || userExpiry === predictedExpiry);
		if (usedEstimatedDate) estimatedDates += 1;

		const actualLocation = entry.lineLocation;
		const predictedLocation = entry.locationPrediction?.location;
		const parsedLocation = entry.line.location;
		const locationCorrected =
			entry.locationOverride ||
			(predictedLocation && actualLocation !== predictedLocation) ||
			(!predictedLocation && actualLocation !== parsedLocation);
		if (locationCorrected) locationCorrections += 1;

		if (entry.shelfLifePrediction?.expiresOn || entry.locationPrediction?.location) {
			rulesImproved += 1;
		}
	}

	return { estimatedDates, locationCorrections, rulesImproved };
}

export function receiptImportToastMessage(
	locale: Locale,
	itemsAdded: number,
	summary: ReceiptImportSummary
): string {
	const headline = translate(locale, 'receiptImport.toastAdded', { count: itemsAdded });
	const detailParts: string[] = [];

	if (summary.estimatedDates > 0) {
		detailParts.push(
			translate(locale, 'receiptImport.toastEstimatedDates', { count: summary.estimatedDates })
		);
	}
	if (summary.locationCorrections > 0) {
		detailParts.push(
			translate(locale, 'receiptImport.toastLocationCorrections', {
				count: summary.locationCorrections
			})
		);
	}
	if (summary.rulesImproved > 0) {
		detailParts.push(
			translate(locale, 'receiptImport.toastRulesImproved', { count: summary.rulesImproved })
		);
	}

	return detailParts.length === 0 ? headline : `${headline} ${detailParts.join(' · ')}`;
}

export function markReceiptImportCompleted(
	itemsAdded: number,
	summary: ReceiptImportSummary = { estimatedDates: 0, locationCorrections: 0, rulesImproved: 0 },
	locationCounts: ReceiptLocationCounts = EMPTY_LOCATION_COUNTS
): void {
	if (typeof sessionStorage === 'undefined') return;

	const payload: ReceiptImportSessionFlag = {
		completedAt: Date.now(),
		itemsAdded,
		estimatedDates: summary.estimatedDates,
		locationCorrections: summary.locationCorrections,
		rulesImproved: summary.rulesImproved,
		locationCounts,
		estimatedExpiryCount: summary.estimatedDates,
		dominantLocation: dominantStorageLocation(locationCounts)
	};
	sessionStorage.setItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY, JSON.stringify(payload));
	sessionStorage.setItem(RECEIPT_IMPORT_TOAST_PENDING_KEY, '1');
	dismissClientToast();
}

export function isReceiptImportToastPending(): boolean {
	if (typeof sessionStorage === 'undefined') return false;
	return sessionStorage.getItem(RECEIPT_IMPORT_TOAST_PENDING_KEY) === '1';
}

export function clearReceiptImportToastPending(): void {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.removeItem(RECEIPT_IMPORT_TOAST_PENDING_KEY);
}

export function clearReceiptImportSuccessPending(): void {
	clearReceiptImportToastPending();
}

export function readReceiptImportCompleted(): ReceiptImportSessionFlag | null {
	if (typeof sessionStorage === 'undefined') return null;
	const raw = sessionStorage.getItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as Partial<ReceiptImportSessionFlag>;
		if (typeof parsed.completedAt !== 'number' || typeof parsed.itemsAdded !== 'number') return null;

		const locationCounts = normalizeLocationCounts(parsed.locationCounts);
		return {
			completedAt: parsed.completedAt,
			itemsAdded: parsed.itemsAdded,
			estimatedDates: typeof parsed.estimatedDates === 'number' ? parsed.estimatedDates : 0,
			locationCorrections:
				typeof parsed.locationCorrections === 'number' ? parsed.locationCorrections : 0,
			rulesImproved: typeof parsed.rulesImproved === 'number' ? parsed.rulesImproved : 0,
			locationCounts,
			estimatedExpiryCount:
				typeof parsed.estimatedExpiryCount === 'number'
					? parsed.estimatedExpiryCount
					: typeof parsed.estimatedDates === 'number'
						? parsed.estimatedDates
						: 0,
			dominantLocation:
				parsed.dominantLocation && LOCATIONS.includes(parsed.dominantLocation)
					? parsed.dominantLocation
					: dominantStorageLocation(locationCounts)
		};
	} catch {
		return null;
	}
}

function normalizeLocationCounts(value: unknown): ReceiptLocationCounts {
	if (!value || typeof value !== 'object') return { ...EMPTY_LOCATION_COUNTS };
	const record = value as Partial<Record<StorageLocation, unknown>>;
	return {
		cupboard: typeof record.cupboard === 'number' ? record.cupboard : 0,
		fridge: typeof record.fridge === 'number' ? record.fridge : 0,
		freezer: typeof record.freezer === 'number' ? record.freezer : 0
	};
}

export function clearReceiptImportCompleted(): void {
	if (typeof sessionStorage === 'undefined') return;
	sessionStorage.removeItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY);
}

export function isReceiptImportRecentlyCompleted(maxAgeMs = 30 * 60 * 1000): boolean {
	const flag = readReceiptImportCompleted();
	if (!flag) return false;
	return Date.now() - flag.completedAt <= maxAgeMs;
}
