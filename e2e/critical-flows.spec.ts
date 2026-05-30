import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
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

	test('onboarding guide is visible for a newly registered user', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
	});

	test('inkop page shows smart fill button', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/inkop/);
		await expect(page.getByRole('region', { name: /Smart påfyllning/i })).toBeVisible();
		await expect(
			page.getByRole('button', { name: /Fyll på från skafferiet/i })
		).toBeVisible();
	});

	test('scan hub loads with mode tiles', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/scan');
		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/scan/);
		await expect(page.locator('nav.mode-tabs')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Streckkod' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Kvitto' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Foto' })).toBeVisible();
	});

	test('marketing landing and login pages return HTTP 200', async ({ request, page }) => {
		await prepareE2eBrowserState(page);

		const landing = await request.get('/');
		expect(landing.status()).toBe(200);

		const login = await request.get('/login');
		expect(login.status()).toBe(200);
	});
});



