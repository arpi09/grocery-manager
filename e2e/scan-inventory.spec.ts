import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen } from './helpers/auth';
import { loadFixture, mockBarcodeLookup } from './helpers/mock-api';

test.describe('Scan and inventory', () => {
	test('bare /scan stays on hub without auto redirect', async ({ page }) => {
		await page.goto('/scan');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('scan-mode-hub')).toBeVisible({ timeout: 15_000 });
		await expect(page).not.toHaveURL(/mode=receipt/);
	});

	test('scan hub loads with receipt primary', async ({ page }) => {
		await page.goto('/scan?mode=hub');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/mode=hub/);
		const hub = page.getByTestId('scan-mode-hub');
		await expect(hub).toBeVisible({ timeout: 15_000 });
		await expect(hub.getByTestId('scan-hub-receipt')).toBeVisible();
		await expect(hub.getByRole('heading', { name: /Vad vill du|What do you want/i })).toBeVisible();

		await expect(page.getByRole('navigation', { name: /Skanningslägen|Scan modes/i })).toHaveCount(0);

		await expect(hub.getByTestId('scan-hub-photo')).toBeVisible();
		await expect(hub.getByTestId('scan-hub-barcode')).toBeVisible();
		await expect(hub.getByTestId('scan-hub-manual')).toBeVisible();
		await expect(hub.getByTestId('scan-hub-receipt')).toContainText(/Kvitto|Receipt/i);
		await expect(hub.getByTestId('scan-hub-photo')).toContainText(/Fota|Photo/i);
		await expect(hub.getByTestId('scan-hub-barcode')).toContainText(/Streckkod|Barcode/i);
		await expect(hub.getByTestId('scan-hub-manual')).toContainText(/Manuellt|Manual/i);
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
		await expect(page.getByText(/Avbryt|Cancel/i)).toHaveCount(0);
	});

	test('scan sub-modes show mode tabs with receipt first', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/scan?mode=photo&from=/inventory/fridge&location=fridge');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/mode=photo/);
		const scanModes = page.getByRole('navigation', { name: /Skanningslägen|Scan modes/i });
		await expect(scanModes).toBeVisible();
		await expect(scanModes.getByRole('link', { name: /Fler sätt|More ways/i })).toHaveCount(0);
		await expect(scanModes.getByRole('link', { name: /Kvitto|Receipt/i })).toBeVisible();
		await expect(scanModes.getByRole('link', { name: /^Foto$|^Photo$/i })).toBeVisible();
		const tabLinks = scanModes.getByRole('link');
		await expect(tabLinks.first()).toContainText(/Kvitto|Receipt/i);
		const manualHref = await scanModes.getByRole('link', { name: /Manuellt|Manual/i }).getAttribute('href');
		expect(manualHref).toMatch(/\/item\/new\?/);
		expect(decodeURIComponent(manualHref!)).toMatch(/mode=hub/);
	});

	test('receipt mode has no duplicate all-modes footer', async ({ page }) => {
		await page.goto('/scan?mode=receipt&from=/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/mode=receipt/);
		await expect(page.getByText(/Alla skanningslägen|All scan modes/i)).toHaveCount(0);
	});

	test('legacy receipt route redirects to unified scan', async ({ page }) => {
		await page.goto('/scan/kvitto?from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan\?.*mode=receipt/);
	});

	test('legacy scan foto route redirects to unified photo mode', async ({ page }) => {
		await page.goto('/scan/foto?from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan\?.*mode=photo/);
	});

	test('legacy inventory foto redirects to unified scan photo mode', async ({ page }) => {
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
		await expect(page.getByTestId('inventory-table').getByText(itemName)).toBeVisible({
			timeout: 10_000
		});
	});

	test('inventory fridge location list loads @deploy-critical', async ({ page }) => {
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/inventory\/fridge/);
		const locationTabs = page.getByRole('navigation', { name: /Förvaringsplatser|Storage locations/i });
		await expect(locationTabs.getByRole('link', { name: /Kyl|Fridge/i })).toBeVisible();
		await expect(locationTabs.getByRole('link', { name: /Frys|Freezer/i })).toBeVisible();
	});

	test('inventory list uses card stack with sort chips', async ({ page }) => {
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		const table = page.getByTestId('inventory-table');
		if (!(await table.isVisible({ timeout: 15_000 }).catch(() => false))) {
			test.skip(true, 'No inventory rows in fridge — list hidden behind empty state');
		}
		await expect(table.getByRole('button', { name: /Namn|Name/i })).toBeVisible();
		await expect(table.getByRole('button', { name: /Antal|Qty|Quantity/i })).toBeVisible();
		await expect(table.getByRole('button', { name: /Bäst före|Expiry/i })).toBeVisible();

		const nameSort = table.getByRole('button', { name: /Namn|Name/i });
		await nameSort.click();
		await expect(nameSort).toHaveClass(/sort-header-btn--active/);
	});

	test.describe('scan mobile manual add', () => {
		test.use({ viewport: { width: 390, height: 844 } });

		test('manual add cancel returns to scan hub', async ({ page }) => {
			await page.goto('/scan?mode=hub');
			await dismissOnboardingModalIfOpen(page);

			await page.getByTestId('scan-hub-manual').click();
			await expect(page).toHaveURL(/\/item\/new/, { timeout: 15_000 });

			await page.getByRole('link', { name: /Avbryt|Cancel/i }).click();
			await expect(page).toHaveURL(/\/scan\?.*mode=hub/, { timeout: 15_000 });
		});
	});

	test('inventory add button opens add sheet with four choices', async ({ page }) => {
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		await page.getByTestId('inventory-add-goods').click();
		const sheet = page.getByTestId('inventory-add-sheet');
		await expect(sheet).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('inventory-add-receipt')).toBeVisible();
		await expect(page.getByTestId('inventory-add-photo')).toBeVisible();
		await expect(page.getByTestId('inventory-add-barcode')).toBeVisible();
		await expect(page.getByTestId('inventory-add-manual')).toBeVisible();
	});
});
