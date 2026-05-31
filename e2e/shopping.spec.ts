import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Shopping list', () => {
	test('add line and check off item', async ({ page }) => {
		const itemName = `E2E Inköp ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await page.locator('#shopping-name').fill(itemName);
		await page.locator('form.add-form').getByRole('button', { name: /Lägg till/i }).click();

		const row = page.locator('.list li').filter({ hasText: itemName });
		await expect(row).toBeVisible({ timeout: 10_000 });

		await row.getByRole('checkbox').click();
		await expect(page.locator('.checked-block .list')).toContainText(itemName, {
			timeout: 15_000
		});
	});

	test('smart fill adds fixture items when E2E_MOCK_AI is enabled', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await page.getByRole('button', { name: /Fyll på från skafferiet/i }).click();

		await expect(page.getByText('E2E Smartfill Mjölk')).toBeVisible({ timeout: 20_000 });
		await expect(page.getByText('E2E Smartfill Banan')).toBeVisible();
	});

});
