import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	loginAsAdmin
} from './helpers/auth';
import {
	addItemViaQuickAdd,
	openChecklistDrawer,
	pickAllUntilTripComplete
} from './helpers/shopping-v2';

test.describe('Shopping UX v2', () => {
	test.setTimeout(90_000);

	test('plan to shop trip flow @deploy-critical', async ({ page }) => {
		test.setTimeout(150_000);
		const itemName = `E2E V2 ${Date.now()}`;

		await loginAsAdmin(page);
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
		await pickAllUntilTripComplete(page, { expectItemName: itemName });

		await page
			.getByTestId('shopping-v2-trip-complete')
			.getByRole('button', { name: /Tillbaka till planering|Back to planning/i })
			.click();
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});

	test('checklist drawer grid filter and back to plan @deploy-critical', async ({ page }) => {
		const itemName = `E2E Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await addItemViaQuickAdd(page, itemName);

		await openChecklistDrawer(page);
		const drawer = page.getByTestId('shopping-v2-legacy-drawer');
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();

		await drawer.getByTestId('data-grid-filter-button').click();
		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(filterSheet).toBeVisible();
		await filterSheet.getByRole('searchbox').fill(itemName);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();

		const row = drawer.locator(`[data-testid^="shopping-grid-row-"]`).filter({ hasText: itemName });
		await expect(row).toBeVisible();
		await expect(row.getByTestId('product-avatar')).toBeVisible();
		/* Activate via keyboard: the table scrolls horizontally inside the drawer,
		   which makes pointer hit-testing on the trailing column flaky. */
		const checkoff = row.getByTestId(/^shopping-grid-checkoff-/);
		await checkoff.focus();
		await page.keyboard.press('Enter');

		const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
		const sheetShown = await pantrySheet
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (sheetShown) {
			await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();
			await expect(pantrySheet).not.toBeVisible({ timeout: 5_000 });
		}

		await drawer.getByRole('button', { name: /Tillbaka till Plan|Back to Plan/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});

	test('checklist drawer accessible from shop mode @deploy-critical', async ({ page }) => {
		const itemName = `E2E Shop Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await addItemViaQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();

		await openChecklistDrawer(page);
		const drawer = page.getByTestId('shopping-v2-legacy-drawer');
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();

		await drawer.getByRole('button', { name: /Tillbaka till Handla|Back to Shop/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();
	});
});
