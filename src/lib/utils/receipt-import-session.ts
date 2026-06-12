export const RECEIPT_IMPORT_JUST_COMPLETED_KEY = 'receipt-import-just-completed';

export interface ReceiptImportSessionFlag {
	completedAt: number;
	itemsAdded: number;
}

export function markReceiptImportCompleted(itemsAdded: number): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	const payload: ReceiptImportSessionFlag = {
		completedAt: Date.now(),
		itemsAdded
	};
	sessionStorage.setItem(RECEIPT_IMPORT_JUST_COMPLETED_KEY, JSON.stringify(payload));
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
		const parsed = JSON.parse(raw) as ReceiptImportSessionFlag;
		if (typeof parsed.completedAt !== 'number' || typeof parsed.itemsAdded !== 'number') {
			return null;
		}
		return parsed;
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
