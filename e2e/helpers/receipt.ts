import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { expect, type Page } from '@playwright/test';

type UploadFile =
	| string
	| {
			name: string;
			mimeType: string;
			buffer: Buffer;
	  };

type FilePayload = {
	name: string;
	mimeType: string;
	base64: string;
};

function toFilePayload(file: UploadFile): FilePayload {
	if (typeof file === 'string') {
		const buffer = readFileSync(file);
		const name = basename(file);
		const mimeType = name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
		return { name, mimeType, base64: buffer.toString('base64') };
	}
	return { name: file.name, mimeType: file.mimeType, base64: file.buffer.toString('base64') };
}

async function uploadViaHook(page: Page, payload: FilePayload) {
	await page.evaluate(async (filePayload) => {
		const hook = (
			window as Window & { __hpE2eReceiptUpload?: (file: File) => Promise<void> }
		).__hpE2eReceiptUpload;
		if (!hook) {
			throw new Error('__hpE2eReceiptUpload hook missing');
		}
		const bytes = Uint8Array.from(atob(filePayload.base64), (char) => char.charCodeAt(0));
		const upload = new File([bytes], filePayload.name, { type: filePayload.mimeType });
		await hook(upload);
	}, payload);
}

async function uploadViaFileInput(page: Page, file: UploadFile) {
	const input = page.getByTestId('receipt-file-input');
	const parseDone = page.waitForResponse(
		(res) => res.url().includes('/api/receipt/parse') && res.request().method() === 'POST',
		{ timeout: 20_000 }
	);
	await input.setInputFiles(file);
	await input.evaluate((el: HTMLInputElement) => {
		el.dispatchEvent(new Event('input', { bubbles: true }));
		el.dispatchEvent(new Event('change', { bubbles: true }));
	});
	const response = await parseDone;
	expect(response.ok()).toBe(true);
}

/** Upload receipt file; uses dev E2E hook when available. */
export async function uploadReceiptFile(page: Page, file: UploadFile) {
	await expect(page.getByTestId('receipt-file-input')).toBeAttached({ timeout: 15_000 });

	const payload = toFilePayload(file);
	const hookReady = page.waitForFunction(
		() =>
			typeof (window as Window & { __hpE2eReceiptUpload?: unknown }).__hpE2eReceiptUpload ===
			'function',
		{ timeout: 15_000 }
	);

	const parseDone = page.waitForResponse(
		(res) => res.url().includes('/api/receipt/parse') && res.request().method() === 'POST',
		{ timeout: 25_000 }
	);

	await hookReady;

	const hasHook = await page.evaluate(
		() =>
			typeof (window as Window & { __hpE2eReceiptUpload?: unknown }).__hpE2eReceiptUpload ===
			'function'
	);

	if (hasHook) {
		await uploadViaHook(page, payload);
		await parseDone;
		return;
	}

	await uploadViaFileInput(page, file);
}

export async function uploadReceiptPdf(page: Page, pdfPath: string) {
	await uploadReceiptFile(page, pdfPath);
}
