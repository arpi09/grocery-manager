import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	loginAsAdmin,
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

	test('expiry reminders toggle saves and shows toast', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings#settings-notifications');
		await dismissOnboardingModalIfOpen(page);

		const expirySwitch = page.getByRole('switch', {
			name: /Skicka e-postp\u00e5minnelser|Send email reminders/i
		});
		await expirySwitch.scrollIntoViewIfNeeded();
		await expect(expirySwitch).toBeVisible({ timeout: 15_000 });

		const expiryForm = page.locator('form.expiry-reminders-form').first();
		await expirySwitch.click();
		await expiryForm.evaluate((form: HTMLFormElement) => {
			const enabled = form.querySelector('input[name="enabled"]') as HTMLInputElement | null;
			if (enabled) {
				enabled.value = enabled.value === 'true' ? 'false' : 'true';
			}
			form.requestSubmit();
		});

		await expect(
			page.locator('.toast-message').filter({ hasText: /Inst\u00e4llningar sparade|Settings saved/i })
		).toBeVisible({ timeout: 15_000 });
	});
});
