import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	prepareE2eBrowserState,
	registerNewUser
} from './helpers/auth';

test.describe('Settings', () => {
	test('settings page loads for authenticated user', async ({ page }) => {
		await registerNewUser(page);
		await prepareE2eBrowserState(page);
		await page.goto('/settings');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByRole('heading', { name: /Inställningar|Settings/i })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByRole('switch', { name: /Skicka e-postpåminnelser|Send email reminders/i })).toBeVisible();
	});
});
