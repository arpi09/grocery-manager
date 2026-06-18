import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import { createFridgeItemViaApi } from './helpers/inventory';

function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

test.describe('Pantry UX v2', () => {
	test.setTimeout(90_000);

	test('shelf zones, tile tap, and table fallback @deploy-critical', async ({ page }) => {
		test.skip(process.env.PANTRY_UX_V2_ENABLED !== 'true', 'Requires PANTRY_UX_V2_ENABLED=true');

		const itemName = `E2E Pantry V2 ${Date.now()}`;
		const expiringName = `E2E Use Soon ${Date.now()}`;

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, itemName);
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(2) });

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('pantry-v2-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('pantry-v2-shelf')).toBeVisible();
		await expect(page.getByTestId('inventory-table')).not.toBeVisible();

		await expect(page.getByTestId('pantry-v2-zone-header-fridge')).toBeVisible();
		await expect(page.getByTestId('pantry-v2-zone-header-freezer')).toBeVisible();
		await expect(page.getByTestId('pantry-v2-zone-header-cupboard')).toBeVisible();

		await expect(page.getByTestId('pantry-v2-use-soon')).toBeVisible();
		await expect(page.getByTestId('pantry-v2-use-soon')).toContainText(expiringName);

		const tile = page.getByTestId('pantry-v2-product-tile').filter({ hasText: itemName }).first();
		await expect(tile).toBeVisible();
		await tile.focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/item\/[^/]+\/edit/, { timeout: 15_000 });

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await page.getByTestId('pantry-v2-zone-view-all-fridge').click();
		await expect(page).toHaveURL(/\/inventory\/fridge/);
		await expect(page.getByTestId('inventory-table')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('inventory-table').getByText(itemName)).toBeVisible();
	});

	test('/inventory shelf has no critical axe violations @deploy-critical', async ({ page }) => {
		test.skip(process.env.PANTRY_UX_V2_ENABLED !== 'true', 'Requires PANTRY_UX_V2_ENABLED=true');

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, `E2E Pantry A11y ${Date.now()}`);

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('pantry-v2-shelf')).toBeVisible({ timeout: 15_000 });
		await expectNoCriticalOrSeriousViolations(page, '/inventory (pantry v2 shelf)');
	});
});
