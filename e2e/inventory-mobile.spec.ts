import { test, expect } from '@playwright/test';

import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen
} from './helpers/auth';
import { createFridgeItemViaApi, ensureFridgeInventoryItem } from './helpers/inventory';

function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

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

	async function openFridgeGrid(page: import('@playwright/test').Page) {
		await page.goto('/inventory/fridge');
		await dismissBlockingOverlays(page);

		const grid = page.getByTestId('pantry-location-grid');
		await expect(grid).toBeVisible({ timeout: 15_000 });

		return grid;
	}

	async function filterGridToItem(page: import('@playwright/test').Page, itemName: string) {
		await page.getByTestId('data-grid-filter-button').click();
		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(filterSheet).toBeVisible({ timeout: 10_000 });
		await filterSheet.locator('#data-grid-filter-search').fill(itemName);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
		await expect(filterSheet).not.toBeVisible({ timeout: 10_000 });
	}

	function inventoryRow(page: import('@playwright/test').Page, itemName: string) {
		return page
			.getByTestId('inventory-table')
			.getByTestId(/inventory-row-/)
			.filter({ hasText: itemName });
	}

	test('mobile data grid shows name sort and stacked row meta', async ({ page }) => {
		const expiringName = `E2E Mobile Expiry ${Date.now()}`;
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(3) });

		await openFridgeGrid(page);
		await filterGridToItem(page, expiringName);

		const table = page.getByTestId('inventory-table');
		await expect(table).toBeVisible({ timeout: 15_000 });
		await expect(table.getByRole('button', { name: /Namn|Name/i })).toBeVisible();
		await expect(table.getByRole('button', { name: /Antal|Qty|Quantity/i })).toHaveCount(0);
		await expect(table.getByRole('button', { name: /Bäst före|Expiry/i })).toHaveCount(0);
		await expect(page.getByTestId('data-grid-filter-button')).toBeVisible();

		const row = inventoryRow(page, expiringName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await expect(row.getByTestId('product-avatar')).toBeVisible();
		await expect(row.getByTestId('inventory-list-meta')).toBeVisible();
		await expect(row.getByTestId('inventory-list-meta')).toHaveText(/dag|day/i);
	});

	test('mobile row tap opens item edit', async ({ page }) => {
		await openFridgeGrid(page);
		await filterGridToItem(page, seededItemName);

		const row = inventoryRow(page, seededItemName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await row.click();
		await expect(page).toHaveURL(/\/item\/[^/]+\/edit/, { timeout: 15_000 });
	});
});
