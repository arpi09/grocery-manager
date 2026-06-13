import { test, expect } from '@playwright/test';

import {

	dismissOnboardingModalIfOpen,

	dismissPageHintIfOpen,

	loginAsAdmin

} from './helpers/auth';

import { ensureFridgeInventoryItem, swipeRowHorizontal } from './helpers/inventory';



test.describe('Inventory mobile UX', () => {

	test.use({ viewport: { width: 390, height: 844 } });

	test.setTimeout(60_000);



	let seededItemName = '';



	test.beforeEach(async ({ page }) => {

		await loginAsAdmin(page);

		seededItemName = await ensureFridgeInventoryItem(page);

	});



	async function dismissBlockingOverlays(page: import('@playwright/test').Page) {
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await page.getByTestId('page-hint-banner').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
	}

	async function openFridgeList(page: import('@playwright/test').Page) {
		await page.goto('/inventory/fridge');
		await dismissBlockingOverlays(page);

		const list = page.getByTestId('inventory-compact-list');
		await expect(list).toBeVisible({ timeout: 15_000 });

		return list;
	}



	function seededRow(list: ReturnType<import('@playwright/test').Page['getByTestId']>) {

		return list.getByTestId('inventory-compact-row').filter({ hasText: seededItemName });

	}



	async function clickUndo(page: import('@playwright/test').Page) {
		const undoBtn = page
			.getByTestId('undo-toast-wrap')
			.getByRole('button', { name: /Ångra|Undo/i });
		await expect(undoBtn).toBeVisible({ timeout: 20_000 });
		await undoBtn.click({ force: true });
	}



	test('compact list shows finish and partial actions', async ({ page }) => {

		const list = await openFridgeList(page);

		const row = seededRow(list);

		await expect(row.getByRole('button', { name: /Slut|Finished/i })).toBeVisible();

		await expect(row.getByRole('button', { name: /Delvis|Partial/i })).toBeVisible();

	});



	test.skip('one-tap finish shows undo toast', async ({ page }) => {

		const list = await openFridgeList(page);

		const row = seededRow(list);

		await dismissBlockingOverlays(page);
		await row.getByRole('button', { name: /Slut|Finished/i }).click({ force: true });
		await clickUndo(page);
		await page.waitForLoadState('networkidle');

		await expect(
			list.getByTestId('inventory-compact-row').filter({ hasText: seededItemName })
		).toBeVisible({ timeout: 15_000 });

	});



	test('partial sheet stays open while scrolling the list', async ({ page }) => {

		const list = await openFridgeList(page);

		const row = seededRow(list);

		await row.getByRole('button', { name: /Delvis|Partial/i }).click();



		const sheet = page.getByTestId('inventory-consume-sheet');

		await expect(sheet).toBeVisible({ timeout: 5_000 });



		await page.evaluate(() => window.scrollBy(0, 500));

		await page.waitForTimeout(300);



		await expect(sheet).toBeVisible();

		await expect(sheet.getByRole('button', { name: /Logga förbrukning|Log usage/i })).toBeVisible();

	});



	test('swipe right finishes item with undo toast', async ({ page }) => {

		const list = await openFridgeList(page);

		const row = seededRow(list);

		await dismissBlockingOverlays(page);
		await swipeRowHorizontal(page, row, 'right');
		await clickUndo(page);
		await page.waitForLoadState('networkidle');
		await expect(
			list.getByTestId('inventory-compact-row').filter({ hasText: seededItemName })
		).toBeVisible({ timeout: 15_000 });

	});



	test('swipe left opens partial consume sheet', async ({ page }) => {

		const list = await openFridgeList(page);

		const row = seededRow(list);

		await swipeRowHorizontal(page, row, 'left');



		const sheet = page.getByTestId('inventory-consume-sheet');

		await expect(sheet).toBeVisible({ timeout: 5_000 });

		await expect(sheet.getByRole('button', { name: /Logga förbrukning|Log usage/i })).toBeVisible();

	});

});

