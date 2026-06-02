import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	prepareE2eBrowserState,
	registerNewUser
} from './helpers/auth';

test.describe('Settings', () => {
	test('settings page loads for authenticated user', async ({ page }) => {
		await prepareE2eBrowserState(page);
		await registerNewUser(page);
		await page.goto('/settings');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByRole('heading', { name: /Inst\u00e4llningar|Settings/i })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByRole('switch', { name: /Skicka e-postp\u00e5minnelser|Send email reminders/i })).toBeVisible();
	});
});
