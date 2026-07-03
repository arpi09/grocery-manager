import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { mockReceiptParse } from './helpers/mock-api';
import { uploadReceiptPdf } from './helpers/receipt';

const FIXTURE_PDF = 'tests/fixtures/receipts/synthetic-ica-01.pdf';

test.describe('Receipt one-tap import', () => {
	test.setTimeout(60_000);

	test('one-tap entry opens receipt flow with autopick source @deploy-critical', async ({ page }) => {
		await mockReceiptParse(page);
		await loginAsAdmin(page);
		await page.goto('/scan?mode=receipt&source=one_tap&autopick=1&from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('receipt-file-input')).toBeAttached({ timeout: 15_000 });
		await uploadReceiptPdf(page, FIXTURE_PDF);

		await expect(page.getByTestId('receipt-review')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('receipt-quick-confirm')).toBeVisible();
	});
});
