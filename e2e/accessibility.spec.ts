import { test, expect } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import { ensureFridgeInventoryItem } from './helpers/inventory';
import { expectHomeDashboardVisible } from './helpers/home';

/** Public routes first (warm server); auth routes share one login session. */
const P0_ROUTES = [
	{ path: '/login', auth: false, name: 'Login' },
	{ path: '/register', auth: false, name: 'Register' },
	{ path: '/', auth: false, name: 'Landing' },
	{ path: '/hem', auth: true, name: 'Home' },
	{ path: '/inventory/fridge', auth: true, name: 'Inventory fridge' },
	{ path: '/inventory/synk', auth: true, name: 'Inventory synk' },
	{ path: '/scan', auth: true, name: 'Scan hub' },
	{ path: '/inkop', auth: true, name: 'Shopping' }
] as const;

test.describe('Accessibility — P0 routes (WCAG 2.2 AA)', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(120_000);

	let authReady = false;

	for (const route of P0_ROUTES) {
		test(`${route.path} has no critical or serious axe violations`, async ({ page }) => {
			const gotoTimeout = route.path === '/' ? 90_000 : 60_000;
			const gotoOptions = { waitUntil: 'commit' as const, timeout: gotoTimeout };

			if (route.auth) {
				if (!authReady) {
					await loginAsAdmin(page);
					authReady = true;
				} else {
					await page.goto('/hem', gotoOptions);
					await dismissOnboardingModalIfOpen(page);
				}
				if (route.path === '/hem') {
					await ensureFridgeInventoryItem(page);
				}
				await page.goto(route.path, gotoOptions);
				await dismissOnboardingModalIfOpen(page);
			} else {
				await page.goto(route.path, gotoOptions);
				await dismissCookieConsentIfOpen(page);
			}

			await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });

			if (route.path === '/hem') {
				await expect(page.locator('.more-on-home')).toHaveCount(0);
				await expectHomeDashboardVisible(page);
			}

			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}
});

test.describe('Accessibility — Pantry V2 shelf (WCAG 2.2 AA)', () => {
	test.setTimeout(120_000);

	test('/inventory shelf has no critical or serious axe violations', async ({ page }) => {
		test.skip(process.env.PANTRY_UX_V2_ENABLED !== 'true', 'Requires PANTRY_UX_V2_ENABLED=true');

		await loginAsAdmin(page);
		await ensureFridgeInventoryItem(page);
		await page.goto('/inventory', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });
		await expect(page.getByTestId('pantry-v2-shelf')).toBeVisible({ timeout: 15_000 });

		await expectNoCriticalOrSeriousViolations(page, '/inventory (pantry v2 shelf)');
	});
});

test.describe('Accessibility — Pantry location data grid (WCAG 2.2 AA)', () => {
	test.setTimeout(120_000);

	test('/inventory/fridge grid has no critical or serious axe violations', async ({ page }) => {
		await loginAsAdmin(page);
		await ensureFridgeInventoryItem(page);
		await page.goto('/inventory/fridge', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });
		await expect(page.getByTestId('pantry-location-grid')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('inventory-table')).toBeVisible();

		await expectNoCriticalOrSeriousViolations(page, '/inventory/fridge (data grid)');
	});
});

test.describe('Accessibility — Shopping checklist drawer (WCAG 2.2 AA)', () => {
	test.setTimeout(120_000);

	test('checklist drawer grid has no critical or serious axe violations', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		await loginAsAdmin(page);
		await page.goto('/inkop', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await page.getByRole('button', { name: /Visa som checklista|Show as checklist/i }).click();

		const drawer = page.getByTestId('shopping-v2-legacy-drawer');
		await expect(drawer).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();

		await expectNoCriticalOrSeriousViolations(page, '/inkop (shopping checklist drawer)');
	});
});
