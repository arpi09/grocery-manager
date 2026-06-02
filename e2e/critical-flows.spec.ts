import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	expectOnboardingGuideVisible,
	loginWithCredentials,
	registerNewUser
} from './helpers/auth';

test.describe('Critical flows', () => {
	test('register creates account with captcha bypass and lands on /scan barcode mode', async ({
		page
	}) => {
		await registerNewUser(page);
		await expect(page).toHaveURL(/\/scan(\?.*mode=barcode)?$/);
	});

	test('login redirects to /hem', async ({ page }) => {
		const { email, password } = await registerNewUser(page);
		await page.context().clearCookies();

		await loginWithCredentials(page, email, password);
		await expect(page).toHaveURL('/hem');
	});

	test('fresh registration skips auto-open onboarding modal on scan hub', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL(/\/scan(\?.*mode=barcode)?$/);
		await expect(
			page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
		).toHaveCount(0);
	});

	test('onboarding quickstart from settings redirects to scan hub', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await page.goto('/settings');
		await dismissOnboardingModalIfOpen(page);
		await expect(page).toHaveURL(/\/settings/);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click();
		await expectOnboardingGuideVisible(page);
		await page.getByTestId('onboarding-quickstart').click();
		await expect(page).toHaveURL(/\/scan(\?.*mode=barcode)?$/);
	});
});

