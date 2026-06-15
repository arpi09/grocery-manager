import { test, expect } from '@playwright/test';
import { prepareE2eBrowserState } from './helpers/auth';

test.describe('Authentication', () => {
	test.setTimeout(60_000);

	test('shows marketing landing for unauthenticated visitors', async ({ page }) => {
		await prepareE2eBrowserState(page);
		await page.goto('/');
		await expect(page).toHaveURL('/');
		await expect(page.getByRole('banner').getByRole('link', { name: 'Skaffu' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 })).toContainText(/Handla ihop|hushåll|Skaffu/i);
		await expect(page.getByRole('banner').getByRole('link', { name: 'Logga in' })).toBeVisible();
		await expect(page.getByTestId('language-switcher')).toBeVisible();
	});
});
