import { test, expect } from '@playwright/test';
import { clickNavHref, clickSecondaryNavHref, dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { expectHomeSectionVisible } from './helpers/home';
import { addItemViaQuickAdd, pickAllUntilTripComplete } from './helpers/shopping-v2';

test.describe('Navigation', () => {
	test.setTimeout(60_000);

	test('can open inventory, planer, and inkop pages', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		await clickNavHref(page, '/inkop');
		await expect(page).toHaveURL(/\/inkop/);
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByRole('heading', { level: 1, name: /^Inköp$/i })).toBeVisible();

		await clickSecondaryNavHref(page, '/planer');
		await expect(page).toHaveURL(/\/planer/);

		await clickNavHref(page, '/hem');
		await expect(page).toHaveURL('/hem');
	});

	test('planer shows generate meal CTA', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		await clickSecondaryNavHref(page, '/planer');
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByTestId('eat-hub-generate')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('eat-hub-generate')).toContainText(/Generera maträtt/i);
	});

	test('planer context expiring link targets pantry not hem', async ({ page }) => {
		await page.goto('/planer');
		await dismissOnboardingModalIfOpen(page);

		const expiringLink = page.locator('.planer-context .home-link');
		await expect(expiringLink).toBeVisible({ timeout: 15_000 });
		await expect(expiringLink).toHaveAttribute('href', /\/inventory/);
		await expect(expiringLink).not.toHaveAttribute('href', /\/hem/);
	});

	test('shopping trip complete scan CTA goes to receipt import', async ({ page }) => {
		test.setTimeout(150_000);
		const itemName = `Nav E2E ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 15_000 });
		await addItemViaQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();
		await pickAllUntilTripComplete(page);

		/* "Har du kvittot?" — receipt one-tap is the primary path into the pantry. */
		const scanCta = page.getByTestId('shopping-v2-complete-scan');
		await expect(scanCta).toBeVisible();
		await scanCta.click();
		await expect(page).toHaveURL(/\/scan\?.*mode=receipt/, { timeout: 15_000 });
	});
});

test.describe('Mobile navigation', () => {
	test.setTimeout(60_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test('home page has no scan-zone card on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expectHomeSectionVisible(page);
		await expect(page.locator('.scan-zone')).toHaveCount(0);
	});

	test('home page has no stray template literal text on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expectHomeSectionVisible(page);
		await expect(page.locator('.app')).not.toContainText('`n');
		await expect(page.locator('.app')).not.toContainText('`t');
	});
});
