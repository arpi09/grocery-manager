import { test } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';

const P0_ROUTES = [
	{ path: '/', auth: false, name: 'Landing' },
	{ path: '/login', auth: false, name: 'Login' },
	{ path: '/register', auth: false, name: 'Register' },
	{ path: '/hem', auth: true, name: 'Home' },
	{ path: '/inventory/fridge', auth: true, name: 'Inventory fridge' },
	{ path: '/scan', auth: true, name: 'Scan hub' },
	{ path: '/inkop', auth: true, name: 'Shopping' }
] as const;

test.describe('Accessibility — P0 routes (WCAG 2.2 AA)', () => {
	test.setTimeout(120_000);

	for (const route of P0_ROUTES) {
		test(`${route.path} has no critical or serious axe violations`, async ({ page }) => {
			const gotoOptions = { waitUntil: 'commit' as const, timeout: 60_000 };

			if (route.auth) {
				await loginAsAdmin(page);
				await page.goto(route.path, gotoOptions);
				await dismissOnboardingModalIfOpen(page);
			} else {
				await page.goto(route.path, gotoOptions);
				await dismissCookieConsentIfOpen(page);
			}

			await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 30_000 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await expectNoCriticalOrSeriousViolations(page, route.path);
		});
	}
});
