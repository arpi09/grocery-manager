import { test, expect } from '@playwright/test';
import {
	expectOnboardingGuideVisible,
	loginWithCredentials,
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

	test('onboarding guide is visible for a newly registered user', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
	});
});
