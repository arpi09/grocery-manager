import { test, expect, type Page } from '@playwright/test';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import {
	dismissOnboardingModalIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { expectNoHorizontalScroll, expectSampledTouchTargets } from './helpers/mobile';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const MOBILE_P0_ROUTES = [
	{ path: '/hem', name: 'Home' },
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
	{ path: '/inkop', name: 'Shopping' },
	{ path: '/item/new?location=fridge&from=/inventory/fridge', name: 'New item' }
] as const;

const MOBILE_P1_ROUTES = [
	{ path: '/planer/vecka', name: 'Weekly ritual' },
	{ path: '/statistik/wrapped', name: 'Pantry wrapped' }
] as const;

async function createFridgeItem(page: Page, name: string) {
	const response = await page.request.post('/item/new?/create', {
		form: {
			name,
			location: 'fridge',
			quantity: '1',
			unit: '',
			expiresOn: '',
			notes: '',
			returnTo: '/inventory/fridge'
		},
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		maxRedirects: 0
	});

	expect([200, 302, 303]).toContain(response.status());
}

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

async function resolveEditItemPath(page: Page): Promise<string> {
	const itemName = `E2E Mobile Edit ${Date.now()}`;
	await createFridgeItem(page, itemName);
	await page.goto('/inventory/fridge', { waitUntil: 'commit' });
	await dismissOnboardingModalIfOpen(page);
	const editLink = page.getByRole('link', { name: itemName });
	const href = await editLink.getAttribute('href');
	expect(href, 'Expected inventory item link to edit form').toBeTruthy();
	return href!;
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
			await loginAsAdmin(page);

			await gotoAuthedRoute(page, route.path, 'expectUrl' in route ? { expectUrl: route.expectUrl } : undefined);

			await expectNoHorizontalScroll(page, route.path);
			await expectSampledTouchTargets(page, route.path);
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}

	test('/item/[id]/edit — layout, touch targets, axe', async ({ page }) => {
		await loginAsAdmin(page);

		const editItemPath = await resolveEditItemPath(page);
		await gotoAuthedRoute(page, editItemPath);

		await expectNoHorizontalScroll(page, editItemPath);
		await expectSampledTouchTargets(page, editItemPath);
		await expectNoCriticalOrSeriousViolations(page, editItemPath);
	});
});

test.describe('Mobile visual — P1 axe routes (390×844)', () => {
	for (const route of MOBILE_P1_ROUTES) {
		test(`${route.path} — axe`, async ({ page }) => {
			await loginAsAdmin(page);

			await gotoAuthedRoute(page, route.path);
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}

	test('/recept/[id] — axe', async ({ page }) => {
		await loginAsAdmin(page);

		const recipePath = await resolveRecipeDetailPath(page);
		await gotoAuthedRoute(page, recipePath);
		await expectNoCriticalOrSeriousViolations(page, recipePath);
	});
});
