import { test, expect } from '@playwright/test';

import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen
} from './helpers/auth';
import { ensureFridgeInventoryItem, swipeRowHorizontal } from './helpers/inventory';

test.describe('Inventory mobile UX', () => {
	test.use({ viewport: { width: 390, height: 844 } });
	test.setTimeout(60_000);

	let seededItemName = '';

	test.beforeEach(async ({ page }) => {
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

	async function openOverflowMenu(page: import('@playwright/test').Page) {
		await expect(page.getByRole('menuitem', { name: /Redigera|Edit/i })).toBeVisible({
			timeout: 10_000
		});
	}

	async function openPartialFromOverflow(page: import('@playwright/test').Page, row: ReturnType<typeof seededRow>) {
		await dismissBlockingOverlays(page);
		const overflow = row.getByTestId('row-overflow-menu').getByRole('button');
		await row.scrollIntoViewIfNeeded();
		await overflow.click();
		await openOverflowMenu(page);
		await page.getByRole('menuitem', { name: /Delvis|Partial/i }).click();
	}

	test('compact list shows finish in overflow and partial actions', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await expect(row).toBeVisible({ timeout: 15_000 });

		await expect(row.getByRole('button', { name: /Slut|Finished|Klart|Done/i })).toHaveCount(0);

		const overflow = row.getByTestId('row-overflow-menu').getByRole('button');
		await row.scrollIntoViewIfNeeded();
		await overflow.click();
		await openOverflowMenu(page);
		await expect(page.getByRole('menuitem', { name: /Ätit upp|Done/i })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Delvis|Partial/i })).toBeVisible({
			timeout: 15_000
		});
	});
	test('partial sheet stays open while scrolling the list', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await expect(row).toBeVisible({ timeout: 15_000 });

		await openPartialFromOverflow(page, row);

		const sheet = page.getByTestId('inventory-consume-sheet');
		await expect(sheet).toBeVisible({ timeout: 5_000 });

		await page.evaluate(() => window.scrollBy(0, 500));
		await expect(sheet).toBeVisible();
		await expect(sheet.getByRole('button', { name: /Logga förbrukning|Log usage/i })).toBeVisible();
	});

	test('swipe right finishes item with undo toast', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);

		await dismissBlockingOverlays(page);
		await swipeRowHorizontal(page, row, 'right');
		await clickUndo(page);
		await expect(seededRow(list)).toBeVisible({ timeout: 15_000 });
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
