import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin', () => {
	test.beforeEach(async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
	});

	test('admin user sees Admin nav and dashboard', async ({ page }) => {
		test.setTimeout(60_000);
		await page.goto('/admin', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL(/\/admin/);
		await expect(page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByRole('heading', { name: 'Användare', level: 2 })).toBeVisible({
			timeout: 15_000
		});
	});
});
