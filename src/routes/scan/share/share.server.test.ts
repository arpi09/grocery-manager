import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { clearReceiptSharePendingStoreForTests } from '$lib/server/receipt-share-pending';
import { POST } from './+server';

const FIXTURE_PDF = join(process.cwd(), 'tests/fixtures/receipts/synthetic-ica-01.pdf');

afterEach(() => {
	clearReceiptSharePendingStoreForTests();
});

function buildShareRequest(file?: File): Request {
	const formData = new FormData();
	if (file) {
		formData.append('receipt', file);
	}
	return new Request('https://skaffu.com/scan/share', {
		method: 'POST',
		body: formData
	});
}

describe('POST /scan/share', () => {
	it('redirects unauthenticated users to login', async () => {
		await expect(
			POST({
				request: buildShareRequest(),
				locals: { user: null, locale: 'sv' },
				url: new URL('https://skaffu.com/scan/share')
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringContaining('/login?redirect=')
		});
	});

	it('stores valid PDF and redirects to receipt review entry', async () => {
		const bytes = readFileSync(FIXTURE_PDF);
		const file = new File([bytes], 'kivra.pdf', { type: 'application/pdf' });

		await expect(
			POST({
				request: buildShareRequest(file),
				locals: { user: { id: 'user-1' }, locale: 'sv' },
				url: new URL('https://skaffu.com/scan/share')
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringMatching(/\/scan\?.*mode=receipt.*source=share_target.*shareKey=/)
		});
	});

	it('redirects with error for unsupported file', async () => {
		const file = new File([Buffer.from([1, 2, 3])], 'notes.txt', { type: 'text/plain' });

		await expect(
			POST({
				request: buildShareRequest(file),
				locals: { user: { id: 'user-1' }, locale: 'sv' },
				url: new URL('https://skaffu.com/scan/share')
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({
			status: 303,
			location: expect.stringContaining('shareError=unsupported')
		});
	});
});
