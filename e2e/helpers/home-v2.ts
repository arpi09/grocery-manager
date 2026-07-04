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

/**
 * Dismiss the receipt-import success moment if it is (or becomes) visible.
 * Escape works regardless of household member count — the secondary CTA
 * testid moves behind the "Fler val" toggle for single-member households.
 * Dismissing also clears the session pending flag so the moment does not
 * reopen on the next navigation and block later clicks.
 */
export async function dismissReceiptImportSuccessIfOpen(page: Page): Promise<void> {
	const success = page.getByTestId('receipt-import-success');
	const appeared = await success
		.waitFor({ state: 'visible', timeout: 5_000 })
		.then(() => true)
		.catch(() => false);
	if (!appeared) return;
	await page.keyboard.press('Escape');
	await expect(success).not.toBeVisible({ timeout: 5_000 });
}

/**
 * A receipt import can complete the activation milestone, which queues the
 * "Bra start!" celebration modal (ActivationCelebration) for the next
 * navigation. Its dismiss paths all navigate away, so clear the pending flag
 * instead to keep multi-import flows on the page they expect.
 */
async function clearCelebrationPending(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (let i = localStorage.length - 1; i >= 0; i -= 1) {
			const key = localStorage.key(i);
			if (key && key.includes('celebration-pending')) {
				localStorage.removeItem(key);
			}
		}
	});
}

async function dismissActivationCelebrationIfOpen(page: Page): Promise<void> {
	const celebration = page.locator('.celebration-panel');
	if (await celebration.isVisible().catch(() => false)) {
		await page.keyboard.press('Escape');
		await celebration.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
	}
}

export async function importReceiptLines(
	page: Page,
	lines: Array<{ name: string; quantity?: string; unit?: string; location?: string }>
): Promise<void> {
	await mockReceiptParse(page, { body: { lines } });
	await page.goto('/scan/kvitto');
	await dismissOnboardingModalIfOpen(page);
	await clearCelebrationPending(page);
	await dismissActivationCelebrationIfOpen(page);
	await dismissReceiptImportSuccessIfOpen(page);
	await uploadReceiptPdf(page, FIXTURE_PDF);
	/* Quick confirm re-checks every line first — the recently-added dedupe chip may have
	   unchecked lines matching pantry items created by earlier specs in the same run. */
	await expect(page.getByTestId('receipt-quick-confirm')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('receipt-quick-confirm').click();
	await dismissReceiptImportSuccessIfOpen(page);
	await clearCelebrationPending(page);
	await dismissActivationCelebrationIfOpen(page);
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
