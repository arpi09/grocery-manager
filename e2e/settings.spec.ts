import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	prepareE2eBrowserState,
	registerNewUser
} from './helpers/auth';

async function waitForSettingsAction(page: import('@playwright/test').Page, action: string) {
	const response = await page.waitForResponse(
		(res) =>
			res.request().method() === 'POST' &&
			res.url().includes('/settings') &&
			res.url().includes(action),
		{ timeout: 20_000 }
	);
	expect(response.ok()).toBeTruthy();
}

test.describe('Settings', () => {
	test('expiry email reminder toggle persists after reload', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await prepareE2eBrowserState(page);
		await page.goto('/settings');
		await dismissOnboardingModalIfOpen(page);

		const expirySwitch = page.getByRole('switch', { name: /Skicka e-postpåminnelser/i });
		await expect(expirySwitch).toBeVisible({ timeout: 15_000 });
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'false');

		const saveOn = waitForSettingsAction(page, 'updateExpiryReminders');
		await expirySwitch.click();
		await saveOn;
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'true');

		await page.reload();
		await dismissOnboardingModalIfOpen(page);
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'true');

		const saveOff = waitForSettingsAction(page, 'updateExpiryReminders');
		await expirySwitch.click();
		await saveOff;
		await page.reload();
		await dismissOnboardingModalIfOpen(page);
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'false');
	});
});
