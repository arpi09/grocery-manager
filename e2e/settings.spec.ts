import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	prepareE2eBrowserState,
	registerNewUser
} from './helpers/auth';

const ACTION_TOAST_PARAM = 'actionToast';

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

		const saved = page.waitForURL(
			(url) =>
				url.pathname === '/settings' &&
				url.searchParams.get(ACTION_TOAST_PARAM) === 'settingsSaved',
			{ timeout: 20_000 }
		);
		await expirySwitch.click();
		await saved;
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'true');

		await page.reload();
		await dismissOnboardingModalIfOpen(page);
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'true');

		const savedOff = page.waitForURL(
			(url) =>
				url.pathname === '/settings' &&
				url.searchParams.get(ACTION_TOAST_PARAM) === 'settingsSaved',
			{ timeout: 20_000 }
		);
		await expirySwitch.click();
		await savedOff;
		await page.reload();
		await dismissOnboardingModalIfOpen(page);
		await expect(expirySwitch).toHaveAttribute('aria-checked', 'false');
	});
});
