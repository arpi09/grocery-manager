import { test, expect } from '@playwright/test';
import { clickNavHref, clickSecondaryNavHref, dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Navigation', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('can open inventory, planer, and inkop pages', async ({ page }) => {
		await clickNavHref(page, '/inkop');
		await expect(page).toHaveURL(/\/inkop/);
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByRole('heading', { level: 1, name: /^Inköp$/i })).toBeVisible();

		await clickSecondaryNavHref(page, '/planer');
		await expect(page).toHaveURL(/\/planer/);

		await clickNavHref(page, '/hem');
		await expect(page).toHaveURL('/hem');
	});

	test('planer shows generate meal CTA', async ({ page }) => {
		await clickSecondaryNavHref(page, '/planer');
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByTestId('eat-hub-generate')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('eat-hub-generate')).toContainText(/Generera maträtt/i);
	});
});

test.describe('Mobile navigation', () => {
	test.setTimeout(60_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('hem is the first bottom tab on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav).toBeVisible();
		await expect(bottomNav.getByTestId('nav-home')).toBeVisible();
		await expect(bottomNav.locator('a[href="/hem"]').first()).toBeVisible();
	});

	test('mobile bottom nav has four tabs including scan', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav.locator('a.nav-tab, button.nav-tab')).toHaveCount(4);
		await expect(bottomNav.getByTestId('nav-home')).toBeVisible();
		await expect(bottomNav.getByTestId('nav-shopping')).toBeVisible();
		await expect(bottomNav.getByTestId('nav-scan')).toBeVisible();
		await expect(bottomNav.getByTestId('mobile-nav-more')).toBeVisible();
		await expect(bottomNav.getByTestId('nav-pantry')).toHaveCount(0);
		await expect(bottomNav.getByTestId('nav-eat')).toHaveCount(0);
	});

	test('scan reachable from bottom tab without header icon', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.locator('.mobile-header-actions [data-testid="nav-scan"]')).toHaveCount(0);
		await page.getByRole('navigation', { name: /Mobil/i }).getByTestId('nav-scan').click();
		await expect(page).toHaveURL(/\/scan/);
	});

	test('home page has no scan-zone card on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.locator('section.home')).toBeVisible();
		await expect(page.locator('.scan-zone')).toHaveCount(0);
	});

	test('home page has no stray template literal text on mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.locator('section.home')).toBeVisible();
		await expect(page.locator('.app')).not.toContainText('`n');
		await expect(page.locator('.app')).not.toContainText('`t');
	});
});
