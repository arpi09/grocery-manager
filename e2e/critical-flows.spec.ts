import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	expectOnboardingGuideVisible,
	loginWithCredentials,
	registerNewUser
} from './helpers/auth';

test.describe('Critical flows', () => {
	test('register creates account with captcha bypass and lands on home', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL('/hem');
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
	});

	test('login redirects to /hem', async ({ page }) => {
		const { email, password } = await registerNewUser(page);
		await page.context().clearCookies();

		await loginWithCredentials(page, email, password);
		await expect(page).toHaveURL('/hem');
	});

	test('fresh registration skips auto-open onboarding modal on home', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL('/hem');
		await expect(
			page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
		).toHaveCount(0);
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
		).toHaveCount(0);
	});

	test('onboarding embedded scan opens picker without navigation', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await page.goto('/settings#settings-app');
		await dismissOnboardingModalIfOpen(page);
		await expect(page).toHaveURL(/\/settings/);
		await page.locator('#settings-app details.settings-disclosure summary').click();
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click();
		await expectOnboardingGuideVisible(page);
		await page.getByRole('button', { name: /Nästa|Next/i }).click();
		await expect(page.getByText(/Steg 2 av 3/i)).toBeVisible();
		await page.getByTestId('onboarding-choose-barcode').click();
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toBeVisible();
		await expect(page).toHaveURL(/\/settings/);
		await expect(page.getByText(/Steg 2 av 3/i)).toBeVisible();
	});

	test('onboarding scan cancel returns to guide without leaving settings', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await page.goto('/settings#settings-app');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click();
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click();
		await expectOnboardingGuideVisible(page);
		await page.getByRole('button', { name: /Nästa|Next/i }).click();
		await page.getByTestId('onboarding-choose-barcode').click();
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toHaveCount(0);
		await expect(page.getByText(/Steg 2 av 3/i)).toBeVisible();
		await expect(page).toHaveURL(/\/settings/);
	});
});
