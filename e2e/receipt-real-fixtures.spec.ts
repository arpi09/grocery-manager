import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { mockReceiptParse } from './helpers/mock-api';
import { uploadReceiptPdf } from './helpers/receipt';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/receipts');

function listRealReceiptPdfs(): string[] {
	if (!existsSync(FIXTURES_DIR)) return [];

	return readdirSync(FIXTURES_DIR)
		.filter((name) => name.toLowerCase().endsWith('.pdf'))
		.filter((name) => !name.startsWith('synthetic-'))
		.filter((name) => /^(ica|kivra|willys)-\d+\.pdf$/i.test(name))
		.sort();
}

const realPdfs = listRealReceiptPdfs();
const describeReal = realPdfs.length > 0 ? test.describe : test.describe.skip;

describeReal('Receipt flow — local real PDF fixtures', () => {
	for (const fileName of realPdfs) {
		test(`${fileName} uploads with mocked parse`, async ({ page }) => {
			const pdfPath = join(FIXTURES_DIR, fileName);

			await mockReceiptParse(page);
			await loginAsAdmin(page);
			await page.goto('/scan/kvitto');
			await dismissOnboardingModalIfOpen(page);

			await uploadReceiptPdf(page, pdfPath);

			await expect(page.getByTestId('receipt-review')).toBeVisible({ timeout: 15_000 });
		});
	}
});
