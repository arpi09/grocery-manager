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

	async function openFridgeList(page: import('@playwright/test').Page) {
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		const list = page.getByTestId('inventory-compact-list');
		await expect(list).toBeVisible({ timeout: 15_000 });
		return list;
	}

	function seededRow(list: ReturnType<import('@playwright/test').Page['getByTestId']>) {
		return list.getByTestId('inventory-compact-row').filter({ hasText: seededItemName });
	}

	test('compact list shows finish and partial actions', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await expect(row.getByRole('button', { name: /Slut|Finished/i })).toBeVisible();
		await expect(row.getByRole('button', { name: /Delvis|Partial/i })).toBeVisible();
	});

	test('one-tap finish shows undo toast', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await row.getByRole('button', { name: /Slut|Finished/i }).click();

		const undoToast = page.getByRole('status').filter({ hasText: /markerad som slut|marked as finished/i });
		await expect(undoToast).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole('button', { name: /Ångra|Undo/i })).toBeVisible();

		await page.getByRole('button', { name: /Ångra|Undo/i }).click();
		await expect(row.getByRole('link', { name: seededItemName })).toBeVisible({ timeout: 10_000 });
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
		await expect(sheet.getByRole('button', { name: /Delvis|Partial/i })).toBeVisible();
	});

	test('swipe right finishes item with undo toast', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await swipeRowHorizontal(page, row, 'right');

		const undoToast = page.getByRole('status').filter({ hasText: /markerad som slut|marked as finished/i });
		await expect(undoToast).toBeVisible({ timeout: 10_000 });

		await page.getByRole('button', { name: /Ångra|Undo/i }).click();
		await expect(row.getByRole('link', { name: seededItemName })).toBeVisible({ timeout: 10_000 });
	});

	test('swipe left opens partial consume sheet', async ({ page }) => {
		const list = await openFridgeList(page);
		const row = seededRow(list);
		await swipeRowHorizontal(page, row, 'left');

		const sheet = page.getByTestId('inventory-consume-sheet');
		await expect(sheet).toBeVisible({ timeout: 5_000 });
		await expect(sheet.getByRole('button', { name: /Delvis|Partial/i })).toBeVisible();
	});
});
