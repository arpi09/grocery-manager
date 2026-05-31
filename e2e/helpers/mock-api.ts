import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page, Route } from '@playwright/test';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

export function loadFixture<T>(filename: string): T {
	return JSON.parse(readFileSync(join(FIXTURES_DIR, filename), 'utf8')) as T;
}

export type ReceiptParseFixture = { lines: Array<{ name: string; quantity?: string }> };

export async function mockReceiptParse(
	page: Page,
	options: { body?: ReceiptParseFixture; status?: number; error?: string } = {}
) {
	const body =
		options.error !== undefined
			? { error: options.error }
			: (options.body ?? loadFixture<ReceiptParseFixture>('receipt-parse.json'));

	await page.route(/\/api\/receipt\/parse$/, async (route: Route) => {
		await route.fulfill({
			status: options.status ?? (options.error ? 422 : 200),
			contentType: 'application/json',
			body: JSON.stringify(body)
		});
	});
}

export async function mockBarcodeLookup(
	page: Page,
	options: { barcode?: string; body?: unknown; status?: number; message?: string } = {}
) {
	const body =
		options.message !== undefined
			? { message: options.message }
			: (options.body ?? loadFixture('barcode.json'));

	const pattern = options.barcode
		? `**/api/barcode/${options.barcode}`
		: '**/api/barcode/*';

	await page.route(pattern, async (route: Route) => {
		if (route.request().method() !== 'GET') {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: options.status ?? (options.message ? 400 : 200),
			contentType: 'application/json',
			body: JSON.stringify(body)
		});
	});
}

export async function mockShoppingSuggestionsApi(
	page: Page,
	options: { body?: unknown; status?: number; error?: string } = {}
) {
	const body =
		options.error !== undefined
			? { error: options.error }
			: {
					...(options.body ?? loadFixture('shopping-suggestions.json')),
					generatedAt: new Date().toISOString()
				};

	await page.route('**/api/shopping-suggestions', async (route: Route) => {
		if (route.request().method() !== 'POST') {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: options.status ?? (options.error ? 502 : 200),
			contentType: 'application/json',
			body: JSON.stringify(body)
		});
	});
}
