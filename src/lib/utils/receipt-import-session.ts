import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import type { StorageLocation } from '$lib/domain/location';
import type { ReceiptLine, ReceiptLocationPrediction, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

export const RECEIPT_IMPORT_JUST_COMPLETED_KEY = 'receipt-import-just-completed';
export const RECEIPT_IMPORT_TOAST_PENDING_KEY = 'receipt-import-toast-pending';

export interface ReceiptImportSummary {
	estimatedDates: number;
	locationCorrections: number;
	rulesImproved: number;
}

export interface ReceiptImportSessionFlag {
	completedAt: number;
	itemsAdded: number;
	estimatedDates: number;
	locationCorrections: number;
	rulesImproved: number;
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
		if (usedEstimatedDate) {
			estimatedDates += 1;
		}

		const actualLocation = entry.lineLocation;
		const predictedLocation = entry.locationPrediction?.location;
		const parsedLocation = entry.line.location;
		const locationCorrected =
			entry.locationOverride ||
			(predictedLocation && actualLocation !== predictedLocation) ||
			(!predictedLocation && actualLocation !== parsedLocation);
		if (locationCorrected) {
			locationCorrections += 1;
		}

		const shelfLearningSignal = Boolean(entry.shelfLifePrediction?.expiresOn);
		const locationLearningSignal = Boolean(entry.locationPrediction?.location);
		if (shelfLearningSignal || locationLearningSignal) {
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

	if (detailParts.length === 0) {
		return headline;
	}

	return `${headline} ${detailParts.join(' · ')}`;
}

export function markReceiptImportCompleted(
	itemsAdded: number,
	summary: ReceiptImportSummary = { estimatedDates: 0, locationCorrections: 0, rulesImproved: 0 }
): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	const payload: ReceiptImportSessionFlag = {
		completedAt: Date.now(),
		itemsAdded,
		estimatedDates: summary.estimatedDates,
		locationCorrections: summary.locationCorrections,
		rulesImproved: summary.rulesImproved
	};
	sessionStorage.setItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY, JSON.stringify(payload));
	sessionStorage.setItem(RECEIPT_IMPORT_TOAST_PENDING_KEY, '1');
}

export function isReceiptImportToastPending(): boolean {
	if (typeof sessionStorage === 'undefined') {
		return false;
	}
	return sessionStorage.getItem(RECEIPT_IMPORT_TOAST_PENDING_KEY) === '1';
}

export function clearReceiptImportToastPending(): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.removeItem(RECEIPT_IMPORT_TOAST_PENDING_KEY);
}

export function readReceiptImportCompleted(): ReceiptImportSessionFlag | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}
	const raw = sessionStorage.getItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY);
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as Partial<ReceiptImportSessionFlag>;
		if (typeof parsed.completedAt !== 'number' || typeof parsed.itemsAdded !== 'number') {
			return null;
		}
		return {
			completedAt: parsed.completedAt,
			itemsAdded: parsed.itemsAdded,
			estimatedDates: typeof parsed.estimatedDates === 'number' ? parsed.estimatedDates : 0,
			locationCorrections:
				typeof parsed.locationCorrections === 'number' ? parsed.locationCorrections : 0,
			rulesImproved: typeof parsed.rulesImproved === 'number' ? parsed.rulesImproved : 0
		};
	} catch {
		return null;
	}
}

export function clearReceiptImportCompleted(): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.removeItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY);
}

export function isReceiptImportRecentlyCompleted(maxAgeMs = 30 * 60 * 1000): boolean {
	const flag = readReceiptImportCompleted();
	if (!flag) {
		return false;
	}
	return Date.now() - flag.completedAt <= maxAgeMs;
}
