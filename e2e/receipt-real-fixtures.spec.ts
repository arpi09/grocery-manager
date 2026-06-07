/**
 * Optional regression for gitignored real receipt PDFs (ica-*, kivra-*, willys-*).
 * Skipped in CI until fixtures are added locally — see docs/RECEIPT_TEST_PACK.md.
 * Parse is mocked (no OPENAI_API_KEY); validates upload + review UI per PDF.
 */
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { mockReceiptParse } from './helpers/mock-api';
import { listRealReceiptPdfs, RECEIPT_FIXTURES_DIR } from './helpers/receipt-fixtures';
import { uploadReceiptPdf } from './helpers/receipt';

const realPdfs = listRealReceiptPdfs();
const describeReal = realPdfs.length > 0 ? test.describe : test.describe.skip;

describeReal('Receipt flow — local real PDF fixtures', () => {
	for (const fileName of realPdfs) {
		test(`${fileName} uploads with mocked parse`, async ({ page }) => {
			const pdfPath = join(RECEIPT_FIXTURES_DIR, fileName);

			await mockReceiptParse(page);
			await loginAsAdmin(page);
			await page.goto('/scan/kvitto');
			await dismissOnboardingModalIfOpen(page);

			await uploadReceiptPdf(page, pdfPath);

			await expect(page.getByTestId('receipt-review')).toBeVisible({ timeout: 15_000 });
		});
	}
});
