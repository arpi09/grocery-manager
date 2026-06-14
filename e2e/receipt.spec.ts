import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { loadFixture, mockReceiptParse } from './helpers/mock-api';
import { uploadReceiptFile, uploadReceiptPdf } from './helpers/receipt';

const FIXTURE_PDF = 'tests/fixtures/receipts/synthetic-ica-01.pdf';

/** Minimal valid JPEG for image upload path (parse response is mocked). */
const FIXTURE_JPEG = {
	name: 'e2e-receipt.jpg',
	mimeType: 'image/jpeg',
	buffer: Buffer.from(
		'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
		'base64'
	)
};

test.describe('Receipt flow', () => {
	test.setTimeout(60_000);
	test('PDF upload shows parsed lines from mocked API', async ({ page }) => {
		await mockReceiptParse(page);
		await loginAsAdmin(page);
		await page.goto('/scan/kvitto');
		await dismissOnboardingModalIfOpen(page);

		await uploadReceiptPdf(page, FIXTURE_PDF);

		await expect(page.getByTestId('receipt-review')).toBeVisible({ timeout: 15_000 });
		const fixture = loadFixture<{ lines: Array<{ name: string }> }>('receipt-parse.json');
		for (const line of fixture.lines) {
			await expect(page.getByText(line.name)).toBeVisible();
		}
	});

	test('image upload shows mocked parse lines', async ({ page }) => {
		await mockReceiptParse(page);
		await loginAsAdmin(page);
		await page.goto('/scan/kvitto');
		await dismissOnboardingModalIfOpen(page);

		await uploadReceiptFile(page, FIXTURE_JPEG);

		await expect(page.getByTestId('receipt-review')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('receipt-line-list')).toBeVisible();
	});

	test('mocked parse failure shows user-friendly error', async ({ page }) => {
		await mockReceiptParse(page, {
			status: 422,
			error: 'Inga varor hittades på kvittot. Prova en skarpare bild, annan PDF eller annan vinkel.'
		});

		await loginAsAdmin(page);
		await page.goto('/scan/kvitto');
		await dismissOnboardingModalIfOpen(page);

		await uploadReceiptPdf(page, FIXTURE_PDF);

		await expect(page.getByTestId('receipt-parse-error')).toContainText(
			/Inga varor hittades på kvittot/i,
			{ timeout: 15_000 }
		);
	});

	test('bulk add selected items redirects with success feedback', async ({ page }) => {
		await mockReceiptParse(page, {
			body: { lines: [{ name: 'E2E Testvara', quantity: '1', unit: '', location: 'fridge' }] }
		});

		await loginAsAdmin(page);
		await page.goto('/scan/kvitto?from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await uploadReceiptPdf(page, FIXTURE_PDF);

		await expect(page.getByTestId('receipt-line-0')).toBeVisible({ timeout: 15_000 });
		await dismissOnboardingModalIfOpen(page);
		await page.getByTestId('receipt-bulk-submit').click();

		await expect(page).toHaveURL(/\/hem(\?|$)/, { timeout: 15_000 });
		await expect(page).toHaveURL(/scan=added/);
		await expect(page.locator('.toast-message')).toContainText(/Klart!|Done!|ligger nu i skafferiet|is now in your pantry/i, {
			timeout: 10_000
		});
		await expect(page.locator('section.home')).toBeVisible({ timeout: 10_000 });
	});
});
