import { test, expect } from '@playwright/test';

import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen
} from './helpers/auth';
import { ensureFridgeInventoryItem } from './helpers/inventory';

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

	test('mobile data grid shows sortable columns', async ({ page }) => {
		await openFridgeGrid(page);

		const table = page.getByTestId('inventory-table');
		await expect(table).toBeVisible({ timeout: 15_000 });
		await expect(table.getByRole('button', { name: /Namn|Name/i })).toBeVisible();
		await expect(table.getByRole('button', { name: /Antal|Qty|Quantity/i })).toBeVisible();
		await expect(table.getByRole('button', { name: /Bäst före|Expiry/i })).toBeVisible();
		await expect(page.getByTestId('data-grid-filter-button')).toBeVisible();
	});

	test('mobile row tap opens item edit', async ({ page }) => {
		await openFridgeGrid(page);

		const row = page.getByTestId('inventory-table').getByText(seededItemName);
		await expect(row).toBeVisible({ timeout: 15_000 });
		await row.click();
		await expect(page).toHaveURL(/\/item\/[^/]+\/edit/, { timeout: 15_000 });
	});
});
