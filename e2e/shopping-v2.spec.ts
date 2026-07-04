import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	loginAsAdmin
} from './helpers/auth';
import {
	addItemViaQuickAdd,
	clearShoppingList,
	dismissPantrySheetIfOpen,
	openChecklistDrawer
} from './helpers/shopping';

test.describe('Shopping UX v2', () => {
	test.setTimeout(90_000);

	test('plan to shop trip flow @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E V2 ${Date.now()}`;

		await loginAsAdmin(page);
		await clearShoppingList(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
		await expect(page.locator('#shopping-list-panel')).not.toBeVisible();

		await page.getByTestId('shopping-v2-mode-plan').click();
		await addItemViaQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();

		/* Other specs may leave unchecked items in the shared admin list — pick those off
		   until our item takes the focus slot, then complete the trip on it. */
		const focusItem = page.getByTestId('shopping-v2-focus-item');
		await expect(async () => {
			await expect(focusItem).toBeVisible({ timeout: 5_000 });
			if (!(await focusItem.innerText()).includes(itemName)) {
				await page.getByTestId('shopping-v2-pick-cta').click();
				await dismissPantrySheetIfOpen(page);
				throw new Error('Leftover item in focus slot — picking it off');
			}
		}).toPass({ timeout: 45_000 });

		await page.getByTestId('shopping-v2-pick-cta').click();
		await dismissPantrySheetIfOpen(page);

		await expect(page.getByTestId('shopping-v2-trip-complete')).toBeVisible({ timeout: 20_000 });

		await expect(async () => {
			await dismissPantrySheetIfOpen(page, 1_000);
			await page
				.getByTestId('shopping-v2-trip-complete')
				.getByRole('button', { name: /Tillbaka till planering|Back to planning/i })
				.click({ timeout: 2_000 });
		}).toPass({ timeout: 20_000 });
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});

	test('checklist drawer grid filter and back to plan @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await clearShoppingList(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await addItemViaQuickAdd(page, itemName);

		const drawer = await openChecklistDrawer(page);
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();
		await expect(drawer.getByText(itemName)).toBeVisible();

		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		/* The filter button can be clicked pre-hydration — retry until the sheet opens. */
		await expect(async () => {
			await drawer.getByTestId('data-grid-filter-button').click();
			await expect(filterSheet).toBeVisible({ timeout: 2_000 });
		}).toPass({ timeout: 15_000 });
		await filterSheet.locator('#data-grid-filter-search').fill(itemName);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();

		const row = drawer.locator(`[data-testid^="shopping-grid-row-"]`).filter({ hasText: itemName });
		await expect(row).toBeVisible();
		await expect(row.getByTestId('product-avatar')).toBeVisible();
		/* Activate via keyboard — sturdier than pointer in the dense grid cell and
		   exercises the a11y path. */
		await row.getByTestId(/^shopping-grid-checkoff-/).focus();
		await page.keyboard.press('Enter');

		await dismissPantrySheetIfOpen(page);

		await drawer.getByRole('button', { name: /Tillbaka till Plan|Back to Plan/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});

	test('checklist drawer accessible from shop mode @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E Shop Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await clearShoppingList(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await addItemViaQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();

		const drawer = await openChecklistDrawer(page);
		await expect(drawer.getByText(itemName)).toBeVisible();

		await drawer.getByRole('button', { name: /Tillbaka till Handla|Back to Shop/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();
	});
});
