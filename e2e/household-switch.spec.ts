import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Household switcher smoke', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('pantry switcher is visible on /hem', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(
			page.locator('.main-nav-desktop').getByTestId('pantry-switcher-trigger-desktop')
		).toHaveAttribute('aria-label', /Byt pantry|Switch pantry/i);
	});
});
