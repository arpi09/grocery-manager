import { test, expect } from '@playwright/test';
import { clickNavHref, dismissOnboardingModalIfOpen, loginAsAdmin, openMoreNav } from './helpers/auth';
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

	test('mobile bottom nav and more sheet work', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav).toBeVisible();

		await bottomNav.getByRole('link', { name: 'Inköp' }).click();
		await expect(page).toHaveURL(/\/inkop/);

		await openMoreNav(page);
		const moreSheet = page.locator('#nav-more-sheet');
		await expect(moreSheet).toBeVisible();
		await moreSheet.getByRole('link', { name: 'Planer' }).click();
		await expect(page).toHaveURL(/\/planer/);
	});
});
