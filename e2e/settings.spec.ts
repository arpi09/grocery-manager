import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	loginAsAdmin
} from './helpers/auth';

test.describe('Settings', () => {
	test('settings page loads for authenticated user', async ({ page }) => {
		await loginAsAdmin(page);
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

	test('push notifications denied state shows help and disables toggle', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(Notification, 'permission', {
				get: () => 'denied',
				configurable: true
			});
		});

		await loginAsAdmin(page);
		await page.goto('/settings#settings-notifications');
		await dismissOnboardingModalIfOpen(page);

		const pushSwitch = page.getByRole('switch', {
			name: /Aktivera webbl\u00e4sarnotiser|Enable browser notifications/i
		});
		await pushSwitch.scrollIntoViewIfNeeded();
		await expect(pushSwitch).toBeVisible({ timeout: 15_000 });
		await expect(pushSwitch).toBeDisabled();

		const status = page.locator('.push-status');
		await expect(status).toBeVisible({ timeout: 15_000 });
		await expect(status).toContainText(/Beh\u00f6righet nekad|Permission denied/i);

		const help = page.getByTestId('push-permission-denied-help');
		await expect(help).toBeVisible();
		await expect(help).toContainText(/l\u00e5s-ikonen|lock icon/i);
		await expect(help).toContainText(/Safari/i);
	});

	test('push notifications row shows status and is not permanently disabled', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings#settings-notifications');
		await dismissOnboardingModalIfOpen(page);

		const pushSwitch = page.getByRole('switch', {
			name: /Aktivera webbl\u00e4sarnotiser|Enable browser notifications/i
		});
		await pushSwitch.scrollIntoViewIfNeeded();
		await expect(pushSwitch).toBeVisible({ timeout: 15_000 });

		const status = page.locator('.push-status');
		await expect(status).toBeVisible({ timeout: 15_000 });
		await expect(status).toContainText(
			/Aktiverad|Av|Kr\u00e4ver app-installation|Beh\u00f6righet nekad|Enabled|Off|Requires app installation|Permission denied/i
		);

		const ariaDisabled = await pushSwitch.getAttribute('aria-disabled');
		const isDisabled = ariaDisabled === 'true' || (await pushSwitch.isDisabled());
		if (isDisabled) {
			await expect(status).toContainText(
				/Kr\u00e4ver app-installation|Beh\u00f6righet nekad|Requires app installation|Permission denied/i
			);
		}
	});

	test('shop today shows requires-push hint when push is off', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings#settings-notifications');
		await dismissOnboardingModalIfOpen(page);

		const pushSwitch = page.getByRole('switch', {
			name: /Aktivera webbl\u00e4sarnotiser|Enable browser notifications/i
		});
		const shopSwitch = page.getByRole('switch', {
			name: /P\u00e5minn mig att handla|Remind me to shop/i
		});
		await shopSwitch.scrollIntoViewIfNeeded();
		await expect(shopSwitch).toBeVisible({ timeout: 15_000 });

		if (await pushSwitch.isChecked() || (await shopSwitch.isChecked())) {
			test.skip(true, 'Push or shop today enabled — requires-push hint not shown');
		}

		const status = page.locator('.push-status');
		const permissionDenied = await status
			.filter({ hasText: /Beh\u00f6righet nekad|Permission denied/i })
			.isVisible()
			.catch(() => false);

		await expect(
			page.locator('.push-hint').filter({
				hasText: permissionDenied
					? /Till\u00e5t webbl\u00e4sarnotiser|Allow browser notifications/i
					: /Aktivera webbl\u00e4sarnotiser|Enable browser notifications/i
			})
		).toBeVisible();
	});

	test('shop today can be turned off when enabled', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings#settings-notifications');
		await dismissOnboardingModalIfOpen(page);

		const shopSwitch = page.getByRole('switch', {
			name: /P\u00e5minn mig att handla|Remind me to shop/i
		});
		await shopSwitch.scrollIntoViewIfNeeded();
		await expect(shopSwitch).toBeVisible({ timeout: 15_000 });

		if (!(await shopSwitch.isChecked())) {
			test.skip(true, 'Shop today not enabled in seed — cannot test turn-off');
		}

		await expect(shopSwitch).toBeEnabled();
		await shopSwitch.click();
		await expect(shopSwitch).not.toBeChecked({ timeout: 10_000 });
	});
});
