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

	test('regular user has no market nav link but direct URL works with nearby opt-in', async ({
		page
	}) => {
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

		await page.goto('/grannskafferiet/marknad', { waitUntil: 'commit' });
		await expect(page.getByTestId('market-v01-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			/Grannskafferiet marknad|Neighbour market/i
		);
	});

	test('admin sees market link in More menu', async ({ page }) => {
		test.setTimeout(90_000);
		await loginAsAdmin(page);
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await openMoreNav(page);
		await expect(page.getByTestId('nav-market-v01')).toBeVisible({ timeout: 15_000 });
	});
});
