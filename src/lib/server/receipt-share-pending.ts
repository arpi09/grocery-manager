import { generateId } from '$lib/infrastructure/auth/id';
import {
	RECEIPT_MAX_BYTES,
	resolveReceiptMimeType
} from '$lib/utils/receipt-file';

export const RECEIPT_SHARE_PENDING_TTL_MS = 5 * 60 * 1000;

export interface ReceiptSharePendingEntry {
	userId: string;
	fileName: string;
	mimeType: string;
	bytes: Uint8Array;
	createdAt: number;
}

const pendingByKey = new Map<string, ReceiptSharePendingEntry>();

function purgeExpired(now = Date.now()): void {
	for (const [key, entry] of pendingByKey) {
		if (now - entry.createdAt > RECEIPT_SHARE_PENDING_TTL_MS) {
			pendingByKey.delete(key);
		}
	}
}

export function storeReceiptSharePending(params: {
	userId: string;
	fileName: string;
	mimeType: string;
	bytes: Uint8Array;
}): string {
	purgeExpired();
	const key = generateId();
	pendingByKey.set(key, {
		userId: params.userId,
		fileName: params.fileName,
		mimeType: params.mimeType,
		bytes: params.bytes,
		createdAt: Date.now()
	});
	return key;
}

export function takeReceiptSharePending(
	key: string,
	userId: string
): ReceiptSharePendingEntry | null {
	purgeExpired();
	const entry = pendingByKey.get(key);
	if (!entry) {
		return null;
	}
	if (entry.userId !== userId) {
		return null;
	}
	if (Date.now() - entry.createdAt > RECEIPT_SHARE_PENDING_TTL_MS) {
		pendingByKey.delete(key);
		return null;
	}
	pendingByKey.delete(key);
	return entry;
}

export function validateReceiptShareFile(
	file: File,
	bytes: Uint8Array
): { ok: true; mimeType: string } | { ok: false; status: 400 | 413 } {
	if (file.size > RECEIPT_MAX_BYTES) {
		return { ok: false, status: 413 };
	}
	const mimeType = resolveReceiptMimeType(file.type, file.name, bytes);
	if (!mimeType) {
		return { ok: false, status: 400 };
	}
	return { ok: true, mimeType };
}

/** Test-only: clear in-memory store between tests. */
export function clearReceiptSharePendingStoreForTests(): void {
	pendingByKey.clear();
}
