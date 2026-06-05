import { test, expect } from '@playwright/test';
import { clickNavHref, dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Navigation', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('can open inventory, planer, and inkop pages', async ({ page }) => {
		await clickNavHref(page, '/inkop');
		await expect(page).toHaveURL(/\/inkop/);
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByRole('heading', { level: 1, name: /^Inköp$/i })).toBeVisible();

		await page.goto('/planer');
		await expect(page).toHaveURL(/\/planer/);

		await clickNavHref(page, '/hem');
		await expect(page).toHaveURL('/hem');
	});
});

test.describe('Mobile navigation', () => {
	test.setTimeout(60_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('bottom nav opens inkop from mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav).toBeVisible();
		await bottomNav.locator('a[href="/inkop"]').click();
		await expect(page).toHaveURL(/\/inkop/);
	});

	test('home page has no stray template literal text on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.locator('section.home')).toBeVisible();
		await expect(page.locator('.app')).not.toContainText('`n');
		await expect(page.locator('.app')).not.toContainText('`t');
	});
});

