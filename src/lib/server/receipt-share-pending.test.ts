import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	clearReceiptSharePendingStoreForTests,
	storeReceiptSharePending,
	takeReceiptSharePending,
	validateReceiptShareFile
} from './receipt-share-pending';

const FIXTURE_PDF = join(process.cwd(), 'tests/fixtures/receipts/synthetic-ica-01.pdf');

afterEach(() => {
	clearReceiptSharePendingStoreForTests();
});

describe('receipt-share-pending', () => {
	it('stores and takes pending file for matching user', () => {
		const bytes = new Uint8Array(readFileSync(FIXTURE_PDF));
		const key = storeReceiptSharePending({
			userId: 'user-1',
			fileName: 'receipt.pdf',
			mimeType: 'application/pdf',
			bytes
		});

		const entry = takeReceiptSharePending(key, 'user-1');
		expect(entry?.fileName).toBe('receipt.pdf');
		expect(entry?.mimeType).toBe('application/pdf');
		expect(entry?.bytes.byteLength).toBe(bytes.byteLength);
		expect(takeReceiptSharePending(key, 'user-1')).toBeNull();
	});

	it('rejects wrong user', () => {
		const key = storeReceiptSharePending({
			userId: 'user-1',
			fileName: 'receipt.pdf',
			mimeType: 'application/pdf',
			bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
		});
		expect(takeReceiptSharePending(key, 'user-2')).toBeNull();
	});

	it('validates receipt mime and size', () => {
		const bytes = new Uint8Array(readFileSync(FIXTURE_PDF));
		const file = new File([bytes], 'receipt.pdf', { type: 'application/pdf' });
		expect(validateReceiptShareFile(file, bytes)).toEqual({
			ok: true,
			mimeType: 'application/pdf'
		});

		const bad = new File([new Uint8Array([1, 2, 3])], 'notes.txt', { type: 'text/plain' });
		expect(validateReceiptShareFile(bad, new Uint8Array([1, 2, 3]))).toEqual({
			ok: false,
			status: 400
		});
	});
});
