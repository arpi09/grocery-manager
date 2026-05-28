import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('can open inventory, planer, and inkop pages', async ({ page }) => {
		const nav = page.getByRole('navigation');

		await nav.getByRole('link', { name: 'Inköp', exact: true }).click();
		await expect(page).toHaveURL(/\/inkop/);
		await expect(page.getByRole('heading', { name: 'Inköp' })).toBeVisible();

		await nav.getByRole('link', { name: 'Planer', exact: true }).click();
		await expect(page).toHaveURL(/\/planer/);

		await nav.getByRole('link', { name: 'Home', exact: true }).click();
		await expect(page).toHaveURL('/');
	});
});
