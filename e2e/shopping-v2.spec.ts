import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Shopping UX v2', () => {
	test.setTimeout(90_000);

	test('plan to shop trip flow @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E V2 ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
		await expect(page.locator('#shopping-list-panel')).not.toBeVisible();

		await page.getByTestId('shopping-v2-mode-plan').click();
		await page.getByRole('button', { name: /Lägg till vara|Add item/i }).click();
		await page.getByTestId('shopping-v2-quick-add').locator('#shopping-v2-name').fill(itemName);
		await page.getByTestId('shopping-v2-quick-add').getByRole('button', { name: /Lägg till|Add/i }).click();
		await expect(page.getByTestId('shopping-v2-summary-pills')).toContainText(itemName, {
			timeout: 15_000
		});

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();
		await expect(page.getByTestId('shopping-v2-focus-item')).toContainText(itemName);

		await page.getByTestId('shopping-v2-pick-cta').click();

		const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
		if (await pantrySheet.isVisible().catch(() => false)) {
			await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();
		}

		await expect(page.getByTestId('shopping-v2-trip-complete')).toBeVisible({ timeout: 20_000 });

		await page.getByRole('button', { name: /Planera|Plan|Back to planning/i }).click();
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});
});
