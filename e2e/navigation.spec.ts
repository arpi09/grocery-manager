import { test, expect } from '@playwright/test';
import { clickNavHref, dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('can open inventory, planer, and inkop pages', async ({ page }) => {
		await clickNavHref(page, '/inkop');
		await expect(page).toHaveURL(/\/inkop/);
		await expect(page.getByRole('heading', { name: /Ink/i })).toBeVisible();

		await page.goto('/planer');
		await expect(page).toHaveURL(/\/planer/);

		await clickNavHref(page, '/hem');
		await expect(page).toHaveURL('/hem');
	});
});

test.describe('Mobile navigation', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('bottom nav opens inkop from mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav).toBeVisible();
		await bottomNav.getByRole('link', { name: /Ink/i }).click();
		await expect(page).toHaveURL(/\/inkop/);
	});
});

