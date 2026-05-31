import { test, expect } from '@playwright/test';
import {
	expectOnboardingGuideVisible,
	loginAsAdmin,
	loginWithCredentials,
	prepareE2eBrowserState,
	registerNewUser
} from './helpers/auth';

test.describe('Critical flows', () => {
	test('register creates account with captcha bypass and lands on /hem', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL('/hem');
	});

	test('login redirects to /hem', async ({ page }) => {
		const { email, password } = await registerNewUser(page);
		await page.context().clearCookies();

		await loginWithCredentials(page, email, password);
		await expect(page).toHaveURL('/hem');
	});

	test('admin login reaches dashboard', async ({ page }) => {
		await loginAsAdmin(page);
		await expect(page.locator('section.home')).toBeVisible();
	});

	test('onboarding guide is visible for a newly registered user', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
	});

	test('marketing landing, login, and register return HTTP 200', async ({ request, page }) => {
		await prepareE2eBrowserState(page);

		for (const path of ['/', '/login', '/register']) {
			const response = await request.get(path);
			expect(response.status(), path).toBe(200);
		}
	});
});
