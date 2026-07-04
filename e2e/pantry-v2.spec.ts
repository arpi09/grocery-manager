import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import { createFridgeItemViaApi } from './helpers/inventory';

function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

function inventoryRowFromTable(page: import('@playwright/test').Page, itemName: string) {
	return page
		.getByTestId('inventory-table')
		.getByTestId(/inventory-row-/)
		.filter({ hasText: itemName });
}

/**
 * Search the data grid via the filter sheet. Accumulated household data paginates the
 * grid, so row asserts must go through search rather than scan the first page. The open
 * click retries because the button can be hit pre-hydration.
 */
async function searchInventoryGrid(page: import('@playwright/test').Page, query: string) {
	const filterSheet = page.getByTestId('data-grid-filter-sheet');
	await expect(async () => {
		await dismissPageHintIfOpen(page);
		await page.getByTestId('data-grid-filter-button').click();
		await expect(filterSheet).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 15_000 });
	await filterSheet.locator('#data-grid-filter-search').fill(query);
	await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
	await expect(filterSheet).not.toBeVisible({ timeout: 10_000 });
}

test.describe('Pantry UX v2', () => {
	test.setTimeout(90_000);

	test('shelf zones, tile tap, and location data grid @deploy-critical', async ({ page }) => {
		test.skip(process.env.PANTRY_UX_V2_ENABLED !== 'true', 'Requires PANTRY_UX_V2_ENABLED=true');

		const itemName = `E2E Pantry V2 ${Date.now()}`;
		const expiringName = `E2E Use Soon ${Date.now()}`;

		await loginAsAdmin(page);
		/* Zones cap at MAX_TILES_PER_ZONE (6), use-soon-first — expire the tile-tap item today
		   so it sorts to the front even when the shared household has accumulated items. */
		await createFridgeItemViaApi(page, itemName, { expiresOn: expiringSoonIso(0) });
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(2) });

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('pantry-v2-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('pantry-v2-shelf')).toBeVisible();
		await expect(page.getByTestId('pantry-location-grid')).not.toBeVisible();

		await expect(page.getByTestId('pantry-v2-zone-header-fridge')).toBeVisible();
		await expect(page.getByTestId('pantry-v2-zone-header-freezer')).toBeVisible();
		await expect(page.getByTestId('pantry-v2-zone-header-cupboard')).toBeVisible();

		/* The band names only the first few items ("+N till") — membership is asserted in the
		   expiring-filtered table below instead, which survives accumulated household data. */
		await expect(page.getByTestId('pantry-v2-use-soon')).toBeVisible();

		await page.getByTestId('pantry-v2-use-soon').getByRole('link', { name: /Visa alla varor|View all items/i }).click();
		await expect(page).toHaveURL(/\/inventory\/all\?filter=expiring/);
		await expect(page.getByTestId('pantry-all-locations-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('inventory-table')).toBeVisible({ timeout: 15_000 });
		await searchInventoryGrid(page, expiringName);
		await expect(inventoryRowFromTable(page, expiringName)).toBeVisible({ timeout: 15_000 });

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		const tile = page.getByTestId('pantry-v2-product-tile').filter({ hasText: itemName }).first();
		await expect(tile).toBeVisible();
		// The tile is a non-focusable <article>; keyboard activation targets the inner link.
		await tile.getByTestId('pantry-v2-tile-body').focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/item\/[^/]+\/edit/, { timeout: 15_000 });

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await page.getByTestId('pantry-v2-zone-view-all-fridge').click();
		await expect(page).toHaveURL(/\/inventory\/fridge/);
		await expect(page.getByTestId('pantry-location-grid')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('inventory-table')).toBeVisible({ timeout: 15_000 });

		await searchInventoryGrid(page, expiringName);

		const expiringRow = inventoryRowFromTable(page, expiringName);
		await expect(expiringRow).toBeVisible({ timeout: 15_000 });
		await expect(expiringRow.getByTestId('inventory-list-meta')).toBeVisible();
		await expect(expiringRow.getByTestId('inventory-list-meta')).toHaveText(/dag|day/i);

		await searchInventoryGrid(page, itemName);
		await expect(page.getByTestId('inventory-table').getByText(itemName)).toBeVisible();
		await expect(page.getByTestId('data-grid-filter-button')).toBeVisible();
	});

	test('use-soon unified list shows items across locations @deploy-critical', async ({ page }) => {
		test.skip(process.env.PANTRY_UX_V2_ENABLED !== 'true', 'Requires PANTRY_UX_V2_ENABLED=true');

		const fridgeExpiring = `E2E Fridge Soon ${Date.now()}`;
		const cupboardExpiring = `E2E Cupboard Soon ${Date.now()}`;

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, fridgeExpiring, { expiresOn: expiringSoonIso(2) });
		await createFridgeItemViaApi(page, cupboardExpiring, {
			location: 'cupboard',
			expiresOn: expiringSoonIso(3)
		});

		await page.goto('/inventory');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('pantry-v2-use-soon')).toBeVisible({ timeout: 15_000 });
		await page.getByTestId('pantry-v2-use-soon').getByRole('link', { name: /Visa alla varor|View all items/i }).click();
		await expect(page).toHaveURL(/\/inventory\/all\?filter=expiring/);
		await expect(page.getByTestId('pantry-all-locations-page')).toBeVisible({ timeout: 15_000 });

		const fridgeRow = inventoryRowFromTable(page, fridgeExpiring);
		const cupboardRow = inventoryRowFromTable(page, cupboardExpiring);

		await searchInventoryGrid(page, fridgeExpiring);
		await expect(fridgeRow).toBeVisible({ timeout: 15_000 });
		await expect(fridgeRow.locator('[data-testid^="location-color-dot-"]')).toBeVisible();

		await searchInventoryGrid(page, cupboardExpiring);
		await expect(cupboardRow).toBeVisible({ timeout: 15_000 });
		await expect(cupboardRow.locator('[data-testid^="location-color-dot-"]')).toBeVisible();
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
