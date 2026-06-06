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

test.describe('Mobile visual — P0 routes (390×844)', () => {
	let authReady = false;

	for (const route of MOBILE_P0_ROUTES) {
		test(`${route.path} — layout, touch targets, axe`, async ({ page }) => {
			if (!authReady) {
				await loginAsAdmin(page);
				authReady = true;
			} else {
				await page.goto('/hem', { waitUntil: 'commit', timeout: 60_000 });
				await dismissOnboardingModalIfOpen(page);
			}

			await gotoAuthedRoute(page, route.path, 'expectUrl' in route ? { expectUrl: route.expectUrl } : undefined);

			await expectNoHorizontalScroll(page, route.path);
			await expectSampledTouchTargets(page, route.path);
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}

	test('/item/[id]/edit — layout, touch targets, axe', async ({ page }) => {
		if (!authReady) {
			await loginAsAdmin(page);
			authReady = true;
		} else {
			await page.goto('/hem', { waitUntil: 'commit', timeout: 60_000 });
			await dismissOnboardingModalIfOpen(page);
		}

		const editItemPath = await resolveEditItemPath(page);
		await gotoAuthedRoute(page, editItemPath);

		await expectNoHorizontalScroll(page, editItemPath);
		await expectSampledTouchTargets(page, editItemPath);
		await expectNoCriticalOrSeriousViolations(page, editItemPath);
	});
});
