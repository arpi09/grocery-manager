import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Settings', () => {
	test('settings page loads for authenticated user', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByRole('heading', { name: /Inst\u00e4llningar|Settings/i })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByRole('link', { name: /^Konto$|^Account$/i })).toBeVisible();
	});

	test('expiry reminders toggle saves and shows toast', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/settings/notifications');
		await dismissOnboardingModalIfOpen(page);

		const expirySwitch = page.getByRole('switch', {
			name: /Skicka e-postp\u00e5minnelser|Send email reminders/i
		});
		await expirySwitch.scrollIntoViewIfNeeded();
		await expect(expirySwitch).toBeVisible({ timeout: 15_000 });

		const expiryForm = page.locator('form.expiry-reminders-form').first();
		await expect(expiryForm).toBeVisible();

		/* Retry the toggle: a click before hydration attaches the submit handler is lost on slow CI runners. */
		await expect(async () => {
			await expirySwitch.click({ timeout: 2_000 });
			await expect(
				page
					.locator('.toast-message')
					.filter({ hasText: /Inst\u00e4llningar sparade|Settings saved/i })
					.first()
			).toBeVisible({ timeout: 5_000 });
		}).toPass({ timeout: 30_000 });
	});

	test('push notifications denied state shows help and disables toggle', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(Notification, 'permission', {
				get: () => 'denied',
				configurable: true
			});
		});

		await loginAsAdmin(page);
		await page.goto('/settings/notifications');
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
		await page.goto('/settings/notifications');
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
		await page.goto('/settings/notifications');
		await dismissOnboardingModalIfOpen(page);

		const pushSwitch = page.getByRole('switch', {
			name: /Aktivera webbl\u00e4sarnotiser|Enable browser notifications/i
		});
		const shopSwitch = page.getByRole('switch', {
			name: /P\u00e5minn mig att handla|Remind me to shop/i
		});
		await shopSwitch.scrollIntoViewIfNeeded();
		await expect(shopSwitch).toBeVisible({ timeout: 15_000 });

		/* In E2E the browser never grants push, and shop-today cannot be enabled
		   without a push subscription (the updateShoppingPush action rejects with
		   push_required), so both switches are deterministically off — the
		   requires-push hint always applies. Assert the precondition instead of
		   self-skipping so a regression that flips either switch on is caught. */
		await expect(pushSwitch).not.toBeChecked();
		await expect(shopSwitch).not.toBeChecked();

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
		await page.goto('/settings/notifications');
		await dismissOnboardingModalIfOpen(page);

		const shopSwitch = page.getByRole('switch', {
			name: /P\u00e5minn mig att handla|Remind me to shop/i
		});
		await shopSwitch.scrollIntoViewIfNeeded();
		await expect(shopSwitch).toBeVisible({ timeout: 15_000 });

		/* TODO(e2e-seed): cannot deterministically seed shop-today ON. Enabling it
		   (updateShoppingPush) requires a real push subscription — the action rejects
		   with push_required otherwise — and headless Chromium grants no push. This
		   stays a conditional skip until we can mock a push subscription for the
		   seeded admin; it is a genuine environment gate, not a hidden seed hole. */
		if (!(await shopSwitch.isChecked())) {
			test.skip(true, 'Shop today requires a push subscription — cannot seed ON in headless E2E');
		}

		await expect(shopSwitch).toBeEnabled();
		await shopSwitch.click();
		await expect(shopSwitch).not.toBeChecked({ timeout: 10_000 });
	});

	test('memory explorer shows empty state when learning is enabled', async ({ page }) => {
		test.skip(
			process.env.SHELF_LIFE_LEARNING_ENABLED !== 'true',
			'Requires SHELF_LIFE_LEARNING_ENABLED=true'
		);

		await loginAsAdmin(page);
		await page.goto('/settings/memory');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('memory-explorer')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('memory-empty-state')).toBeVisible();
	});
});
