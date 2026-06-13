import { test } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';

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
				await page.goto(route.path, gotoOptions);
				await dismissOnboardingModalIfOpen(page);
			} else {
				await page.goto(route.path, gotoOptions);
				await dismissCookieConsentIfOpen(page);
			}

			await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });

			if (route.path === '/hem') {
				await expect(page.locator('.more-on-home')).toHaveCount(0);
				expect(await page.locator('.home-v3-section').count()).toBeGreaterThanOrEqual(2);
			}

			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}
});
