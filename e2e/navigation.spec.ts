import { test, expect } from '@playwright/test';
import { clickNavHref, loginAsAdmin } from './helpers/auth';

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

		await clickNavHref(page, '/');
		await expect(page).toHaveURL('/');
	});
});
