import { test, expect, type Page } from '@playwright/test';

import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';



function uncheckedShoppingRow(page: Page, itemName: string) {

	return page

		.locator('#shopping-list-panel [data-testid^="shopping-grid-row-"]')

		.filter({ hasText: itemName });

}



function uncheckedShoppingRows(page: Page) {

	return page.locator('#shopping-list-panel [data-testid^="shopping-grid-row-"]');

}



async function ensureSmartFillVisible(page: Page) {

	const fold = page.getByTestId('shopping-suggestions-fold');

	if (!(await fold.isVisible().catch(() => false))) {

		const uncheckedRows = uncheckedShoppingRows(page);

		while ((await uncheckedRows.count()) > 0) {

			const before = await uncheckedRows.count();

			const row = uncheckedRows.first();

			await row.locator('form[action="?/toggle"] input[type=checkbox]').click();

			const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');

			if (await pantrySheet.isVisible().catch(() => false)) {

				await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();

			}

			await expect(uncheckedRows).toHaveCount(before - 1, { timeout: 10_000 });

		}



		await page.reload();

		await dismissOnboardingModalIfOpen(page);

	}



	await openShoppingSuggestionsFold(page);

}



async function openShoppingSuggestionsFold(page: Page) {

	const fold = page.getByTestId('shopping-suggestions-fold');

	await expect(fold).toBeVisible({ timeout: 15_000 });

	const isOpen = await fold.evaluate((el) => (el as HTMLDetailsElement).open);

	if (!isOpen) {

		await fold.locator(':scope > summary').click();

	}

	await expect(page.getByTestId('shopping-smart-fill')).toBeVisible({ timeout: 15_000 });

}



test.describe('Shopping list', () => {

	test.setTimeout(60_000);



	test('smart fill adds fixture items when E2E_MOCK_AI is enabled', async ({ page }) => {

		await loginAsAdmin(page);

		await page.goto('/inkop');

		await dismissOnboardingModalIfOpen(page);

		await dismissPageHintIfOpen(page);

		await ensureSmartFillVisible(page);

		await openShoppingSuggestionsFold(page);

		await page.getByTestId('shopping-smart-fill').click();



		const panel = page.locator('#shopping-list-panel');

		await expect(panel.getByText(/E2E Smartfill Mj/)).toBeVisible({ timeout: 20_000 });

		await expect(panel.getByText('E2E Smartfill Banan')).toBeVisible();

		await expect(panel).toBeInViewport({ timeout: 10_000 });

	});



	test('add line and check off item @deploy-critical', async ({ page }) => {

		test.setTimeout(60_000);

		const itemName = `E2E Inkop ${Date.now()}`;



		await loginAsAdmin(page);

		await page.goto('/inkop');

		await dismissOnboardingModalIfOpen(page);

		await dismissPageHintIfOpen(page);



		await page.locator('#shopping-name').fill(itemName);

		await page.locator('form.add-form').getByRole('button', { name: /L.gg till|Add/i }).click();



		const row = uncheckedShoppingRow(page, itemName);

		await expect(row).toBeVisible({ timeout: 15_000 });



		await row.locator('form[action="?/toggle"] input[type=checkbox]').click();

		await dismissPageHintIfOpen(page);



		const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');

		if (await pantrySheet.isVisible().catch(() => false)) {

			await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();

		}



		await expect(row).toHaveCount(0, { timeout: 20_000 });

	});



	test('grid filter finds added item @deploy-critical', async ({ page }) => {

		test.setTimeout(60_000);

		const itemName = `E2E Grid Filter ${Date.now()}`;



		await loginAsAdmin(page);

		await page.goto('/inkop');

		await dismissOnboardingModalIfOpen(page);

		await dismissPageHintIfOpen(page);



		await page.locator('#shopping-name').fill(itemName);

		await page.locator('form.add-form').getByRole('button', { name: /L.gg till|Add/i }).click();



		const row = uncheckedShoppingRow(page, itemName);

		await expect(row).toBeVisible({ timeout: 15_000 });



		await page.getByTestId('data-grid-filter-button').click();

		const filterSheet = page.getByTestId('data-grid-filter-sheet');

		await expect(filterSheet).toBeVisible();

		await filterSheet.getByRole('textbox').fill(itemName);

		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();



		await expect(uncheckedShoppingRow(page, itemName)).toBeVisible();

		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();

	});



	test('check off opens pantry bridge sheet and can add to pantry', async ({ page }) => {

		test.setTimeout(60_000);

		const itemName = `E2E Pantry Bridge ${Date.now()}`;



		await loginAsAdmin(page);

		await page.goto('/inkop');

		await dismissOnboardingModalIfOpen(page);

		await dismissPageHintIfOpen(page);



		await page.locator('#shopping-name').fill(itemName);

		await page.locator('form.add-form').getByRole('button', { name: /L.gg till|Add/i }).click();



		const row = uncheckedShoppingRow(page, itemName);

		await expect(row).toBeVisible({ timeout: 15_000 });



		await row.locator('form[action="?/toggle"] input[type=checkbox]').click();

		await dismissPageHintIfOpen(page);



		const sheet = page.getByTestId('shopping-to-pantry-sheet');

		await expect(sheet).toBeVisible({ timeout: 20_000 });

		await sheet.getByRole('button', { name: /Ja,|Yes,/i }).click();



		await expect(

			page.locator('.toast-message').filter({ hasText: /skafferiet|pantry/i })

		).toBeVisible({ timeout: 15_000 });

	});

});

