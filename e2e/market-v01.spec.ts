import { test, expect } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin,
	openMoreNav,
	registerNewUser
} from './helpers/auth';

test.describe('Market v0.1 access', () => {
	test.use({ actionTimeout: 45_000 });

	test('regular user gets 404 on market when live is off', async ({ page }) => {
		test.setTimeout(90_000);
		await registerNewUser(page);
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await openMoreNav(page);
		await expect(page.getByTestId('nav-market-v01')).toHaveCount(0);

		const optInResponse = await page.request.post('/api/expiring-share/nearby-settings', {
			data: { enabled: true, latitude: 59.329323, longitude: 18.068581 }
		});
		expect(optInResponse.ok()).toBeTruthy();

		const marketResponse = await page.request.get('/grannskafferiet/marknad');
		expect(marketResponse.status()).toBe(404);

		await page.goto('/grannskafferiet/marknad', { waitUntil: 'commit' });
		await expect(page.getByTestId('market-v01-page')).toHaveCount(0);
	});

	test('admin sees market link and page without live flag', async ({ page }) => {
		test.setTimeout(90_000);
		await loginAsAdmin(page);
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await openMoreNav(page);
		await expect(page.getByTestId('nav-market-v01')).toBeVisible({ timeout: 15_000 });

		await page.goto('/grannskafferiet/marknad', { waitUntil: 'commit' });
		await expect(page.getByTestId('market-v01-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell-tab-map')).toHaveAttribute('aria-current', 'page');
	});
});

test.describe('Market v0.5 shell', () => {
	test.use({ actionTimeout: 45_000 });

	test('admin navigates tabs and chat returns to inbox', async ({ page }) => {
		test.setTimeout(120_000);
		await loginAsAdmin(page);
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		const seedResponse = await page.request.post('/api/admin/market/seed-demo');
		expect(seedResponse.ok()).toBeTruthy();

		await page.goto('/grannskafferiet/marknad', { waitUntil: 'commit' });
		await expect(page.getByTestId('market-shell')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-v01-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell-tab-map')).toHaveAttribute('aria-current', 'page');

		await page.getByTestId('market-shell-tab-messages').click();
		await expect(page).toHaveURL(/\/grannskafferiet\/marknad\/meddelanden/);
		await expect(page.getByTestId('market-inbox')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell-tab-messages')).toHaveAttribute('aria-current', 'page');

		await page.getByTestId('market-shell-tab-profile').click();
		await expect(page).toHaveURL(/\/grannskafferiet\/marknad\/profil/);
		await expect(page.getByTestId('market-profile-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell-tab-profile')).toHaveAttribute('aria-current', 'page');

		await page.goto('/grannskafferiet/marknad/chatt/market-demo-thread-1', { waitUntil: 'commit' });
		await expect(page.getByTestId('market-chat-thread')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell')).toHaveCount(0);

		await page.getByRole('button', { name: /Tillbaka till meddelande|Back to message/i }).click();
		await expect(page).toHaveURL(/\/grannskafferiet\/marknad\/meddelanden/);
		await expect(page.getByTestId('market-inbox')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('market-shell-tab-messages')).toHaveAttribute('aria-current', 'page');
	});
});
