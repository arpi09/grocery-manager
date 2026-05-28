import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Authentication', () => {
	test('redirects unauthenticated users to login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	});

	test('admin can sign in and reach home', async ({ page }) => {
		await loginAsAdmin(page);
		await expect(page.getByRole('heading', { name: 'Home Pantry' })).toBeVisible();
	});
});
