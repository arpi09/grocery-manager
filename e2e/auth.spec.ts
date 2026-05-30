import { test, expect } from '@playwright/test';
import { loginAsAdmin, prepareE2eBrowserState } from './helpers/auth';

test.describe('Authentication', () => {
	test('redirects unauthenticated users to login', async ({ page }) => {
		await prepareE2eBrowserState(page);
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole('heading', { name: 'Logga in' })).toBeVisible();
	});

	test('admin can sign in and reach home', async ({ page }) => {
		await loginAsAdmin(page);
	});
});