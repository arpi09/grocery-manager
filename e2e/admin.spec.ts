import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('admin user sees Admin nav and dashboard', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/admin/);
		await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Användare' })).toBeVisible();
	});
});
