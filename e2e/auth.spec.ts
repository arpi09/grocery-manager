import { test, expect } from '@playwright/test';
import { loginAsAdmin, prepareE2eBrowserState } from './helpers/auth';

test.describe('Authentication', () => {
	test('shows marketing landing for unauthenticated visitors', async ({ page }) => {
		await prepareE2eBrowserState(page);
		await page.goto('/');
		await expect(page).toHaveURL('/');
		await expect(page.getByRole('heading', { level: 1 })).toContainText(/Skanna/i);
		await expect(page.getByRole('banner').getByRole('link', { name: 'Logga in' })).toBeVisible();
	});

	test('admin can sign in and reach home', async ({ page }) => {
		await loginAsAdmin(page);
	});
});