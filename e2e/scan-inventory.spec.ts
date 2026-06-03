import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { loadFixture, mockBarcodeLookup } from './helpers/mock-api';

test.describe('Scan and inventory', () => {
	test('scan hub loads with photo round primary', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/scan');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan(?!\?.*mode=)/);
		await expect(page.getByTestId('scan-hub-photo-round')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Foto-runda' })).toBeVisible();

		await page.getByTestId('scan-hub-other-modes').click();
		await expect(page.getByTestId('scan-hub-other-modes-panel')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Streckkod' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Kvitto' })).toBeVisible();
	});

	test('legacy receipt route redirects to unified scan', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/scan/kvitto?from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan\?.*mode=receipt/);
	});

	test('legacy inventory foto redirects to unified scan photo mode', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inventory/foto?from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan\?.*mode=photo/);
	});

	test('manual barcode lookup and add item to inventory', async ({ page }) => {
		test.setTimeout(60_000);
		const fixture = loadFixture<{
			product: { barcode: string; name: string };
		}>('barcode.json');
		const barcode = fixture.product.barcode;
		const itemName = `E2E Scan ${Date.now()}`;

		await page.setViewportSize({ width: 1400, height: 900 });
		await mockBarcodeLookup(page, { barcode, body: fixture });
		await loginAsAdmin(page);
		await page.goto(`/scan?mode=barcode&location=fridge&from=/inventory/fridge`);
		await dismissOnboardingModalIfOpen(page);

		const manualBarcode = page.locator('#manual-barcode');
		if (await manualBarcode.isVisible().catch(() => false)) {
			await manualBarcode.fill(barcode);
			await page.getByRole('button', { name: /^Sök$/i }).click();
			await expect(page.locator('#scan-product-name')).toBeVisible({ timeout: 15_000 });
			await page.locator('#scan-product-name').fill(itemName);
			await page.locator('form.save-form').getByRole('button', { name: /^Spara$/i }).click();
		} else {
			await page.goto(`/item/new?location=fridge&from=/inventory/fridge`);
			await page.locator('input[name="name"]').fill(itemName);
			await page.locator('form').getByRole('button', { name: /L.gg till vara/i }).click();
		}

		await expect(page).toHaveURL(/\/inventory\/fridge/, { timeout: 15_000 });
		await expect(page.locator('.inventory-page').getByText(itemName)).toBeVisible({ timeout: 10_000 });
	});

	test('inventory fridge location list loads', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/inventory\/fridge/);
		await expect(page.getByRole('link', { name: 'Kyl' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Frys' })).toBeVisible();
	});
});
