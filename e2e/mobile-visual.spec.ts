import { test, expect, type Page } from '@playwright/test';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import {
	dismissOnboardingModalIfOpen,
	prepareE2eBrowserState
} from './helpers/auth';
import { createFridgeItemViaApi } from './helpers/inventory';
import { expectNoHorizontalScroll, expectSampledTouchTargets } from './helpers/mobile';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const MOBILE_P0_ROUTES = [
	{ path: '/inkop', name: 'Shopping home' },
	{ path: '/inventory/fridge', name: 'Inventory fridge' },
	{ path: '/inventory/cupboard', name: 'Inventory cupboard' },
	{ path: '/inventory/freezer', name: 'Inventory freezer' },
	{ path: '/inventory/synk', name: 'Inventory synk' },
	{
		path: '/inventory/foto?from=/hem',
		name: 'Inventory foto redirect',
		expectUrl: /\/scan\?.*mode=photo/
	},
	{ path: '/scan', name: 'Scan hub' },
	{ path: '/scan?mode=barcode&from=/hem', name: 'Scan barcode' },
	{ path: '/scan?mode=receipt&from=/hem', name: 'Scan receipt' },
	{ path: '/scan?mode=photo&from=/hem', name: 'Scan photo' },
	{ path: '/item/new?location=fridge&from=/inventory/fridge', name: 'New item' }
] as const;

const MOBILE_P1_ROUTES = [
	{ path: '/planer/vecka', name: 'Weekly ritual' },
	{ path: '/statistik/wrapped', name: 'Pantry wrapped' }
] as const;

async function gotoAuthedRoute(
	page: Page,
	path: string,
	options?: { expectUrl?: RegExp }
) {
	await page.goto(path, { waitUntil: 'commit', timeout: 60_000 });
	if (new URL(page.url()).pathname.startsWith('/login')) {
		await loginAsAdmin(page);
		await page.goto(path, { waitUntil: 'commit', timeout: 60_000 });
	}
	await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
	await dismissOnboardingModalIfOpen(page);

	if (options?.expectUrl) {
		await expect(page).toHaveURL(options.expectUrl, { timeout: 15_000 });
	}

	await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });
	await expect(page.locator('.app')).toBeVisible({ timeout: 15_000 });
}

async function filterGridToItem(page: Page, itemName: string) {
	await page.getByTestId('data-grid-filter-button').click();
	const filterSheet = page.getByTestId('data-grid-filter-sheet');
	await expect(filterSheet).toBeVisible({ timeout: 10_000 });
	await filterSheet.locator('#data-grid-filter-search').fill(itemName);
	await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
	await expect(filterSheet).not.toBeVisible({ timeout: 10_000 });
}

async function resolveEditItemPath(page: Page): Promise<string> {
	const itemName = `E2E Mobile Edit ${Date.now()}`;
	await createFridgeItemViaApi(page, itemName);
	await page.goto('/inventory/fridge', { waitUntil: 'commit' });
	await dismissOnboardingModalIfOpen(page);

	const grid = page.getByTestId('pantry-location-grid');
	await expect(grid).toBeVisible({ timeout: 15_000 });
	await filterGridToItem(page, itemName);

	const row = page
		.getByTestId('inventory-table')
		.getByTestId(/inventory-row-/)
		.filter({ hasText: itemName });
	await expect(row).toBeVisible({ timeout: 15_000 });

	const rowTestId = await row.getAttribute('data-testid');
	expect(rowTestId, 'Expected inventory row test id').toBeTruthy();
	const itemId = rowTestId!.replace('inventory-row-', '');
	return `/item/${itemId}/edit`;
}

async function resolveRecipeDetailPath(page: Page): Promise<string> {
	const response = await page.request.post('/api/recipes', {
		headers: { 'Content-Type': 'application/json' },
		data: { portions: 2 }
	});
	expect(response.ok()).toBeTruthy();
	const payload = (await response.json()) as { recipes?: Array<{ id: string }> };
	const recipeId = payload.recipes?.[0]?.id;
	expect(recipeId, 'Expected mocked recipe id from /api/recipes').toBeTruthy();
	return `/recept/${recipeId}`;
}

test.describe('Mobile visual — P0 routes (390×844)', () => {
	for (const route of MOBILE_P0_ROUTES) {
		test(`${route.path} — layout, touch targets, axe`, async ({ page }) => {
			await prepareE2eBrowserState(page);

			await gotoAuthedRoute(page, route.path, 'expectUrl' in route ? { expectUrl: route.expectUrl } : undefined);

			await expectNoHorizontalScroll(page, route.path);
			await expectSampledTouchTargets(page, route.path);
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}

	test('/item/[id]/edit — layout, touch targets, axe', async ({ page }) => {
		await prepareE2eBrowserState(page);

		const editItemPath = await resolveEditItemPath(page);
		await gotoAuthedRoute(page, editItemPath);

		await expectNoHorizontalScroll(page, editItemPath);
		await expectSampledTouchTargets(page, editItemPath);
		await expectNoCriticalOrSeriousViolations(page, editItemPath);
	});

	test('/item/[id]/edit — save vs log consumption labels', async ({ page }) => {
		await prepareE2eBrowserState(page);

		const editItemPath = await resolveEditItemPath(page);
		await gotoAuthedRoute(page, editItemPath);

		await expect(page.getByRole('button', { name: /Spara ändringar|Save changes/i })).toBeVisible();
		await expect(
			page.getByRole('button', { name: /^Delvis$|^Partial$/i })
		).toHaveCount(0);
		await expect(
			page.getByRole('button', { name: /Logga förbrukning|Log usage/i })
		).toBeVisible();
	});

	test('/item/[id]/edit — log consumption stays on edit page', async ({ page }) => {
		await prepareE2eBrowserState(page);

		const editItemPath = await resolveEditItemPath(page);
		await gotoAuthedRoute(page, editItemPath);

		const consumeSection = page.locator('.consumption-section');
		await consumeSection.scrollIntoViewIfNeeded();
		await consumeSection.locator('input[name="consumptionPreset"][value="half"]').check({ force: true });
		await consumeSection.getByRole('button', { name: /Logga förbrukning|Log usage/i }).click();

		await expect(page).toHaveURL(new RegExp(`${editItemPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?|$)`), {
			timeout: 15_000
		});
	});
});

test.describe('Mobile visual — P1 axe routes (390×844)', () => {
	for (const route of MOBILE_P1_ROUTES) {
		test(`${route.path} — axe`, async ({ page }) => {
			await prepareE2eBrowserState(page);

			await gotoAuthedRoute(page, route.path);
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}

	test('/recept/[id] — axe', async ({ page }) => {
		await prepareE2eBrowserState(page);

		const recipePath = await resolveRecipeDetailPath(page);
		await gotoAuthedRoute(page, recipePath);
		await expectNoCriticalOrSeriousViolations(page, recipePath);
	});
});
