import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Shopping list', () => {
	test('add line and check off item', async ({ page }) => {
		test.setTimeout(60_000);
		const itemName = `E2E Inkop ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await page.locator('#shopping-name').fill(itemName);
		await page.locator('form.add-form').getByRole('button', { name: /L.gg till/i }).click();

		const row = page.locator('ul.list:not(.checked) li').filter({ hasText: itemName });
		await expect(row).toBeVisible({ timeout: 15_000 });

		await row.locator('form[action="?/toggle"] input[type=checkbox]').click();
		await expect(
			page
				.locator('.toast-message')
				.filter({ hasText: new RegExp(`${itemName} avbockad`, 'i') })
		).toBeVisible({ timeout: 15_000 });
		await expect(row).toHaveCount(0, { timeout: 15_000 });
	});

	test('smart fill adds fixture items when E2E_MOCK_AI is enabled', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await page.getByRole('button', { name: /Fyll p.+fr.n skafferiet/i }).click();

		await expect(page.getByText(/E2E Smartfill Mj/)).toBeVisible({ timeout: 20_000 });
		await expect(page.getByText('E2E Smartfill Banan')).toBeVisible();
	});
});
