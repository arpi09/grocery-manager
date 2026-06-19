import { expect, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen } from './auth';
import { mockReceiptParse } from './mock-api';
import { uploadReceiptPdf } from './receipt';

const FIXTURE_PDF = 'tests/fixtures/receipts/synthetic-ica-01.pdf';

export async function addShoppingListItemViaApi(page: Page, name: string): Promise<void> {
	const response = await page.request.post('/inkop?/add', {
		form: { name, quantity: '', unit: '' },
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		}
	});

	expect(response.ok()).toBe(true);
}

export async function importReceiptLines(
	page: Page,
	lines: Array<{ name: string; quantity?: string; unit?: string; location?: string }>
): Promise<void> {
	await mockReceiptParse(page, { body: { lines } });
	await page.goto('/scan/kvitto');
	await dismissOnboardingModalIfOpen(page);
	await uploadReceiptPdf(page, FIXTURE_PDF);
	await expect(page.getByTestId('receipt-bulk-submit')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('receipt-bulk-submit').click();

	const success = page.getByTestId('receipt-import-success');
	if (await success.isVisible({ timeout: 5_000 }).catch(() => false)) {
		await page.getByTestId('receipt-success-cta-secondary').click({ timeout: 5_000 }).catch(() => {});
	}
}

export function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

export async function openHomeV2Briefing(page: Page): Promise<void> {
	await page.goto('/hem');
	await dismissOnboardingModalIfOpen(page);
	await dismissPageHintIfOpen(page);
	await expect(page.getByTestId('home-v2-page')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('home-v2-briefing')).toBeVisible();
}
