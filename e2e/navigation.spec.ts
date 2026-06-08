import { test, expect } from '@playwright/test';
import { clickNavHref, dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

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

		await page.goto('/planer');
		await expect(page).toHaveURL(/\/planer/);

		await clickNavHref(page, '/hem');
		await expect(page).toHaveURL('/hem');
	});

	test('planer shows generate meal CTA', async ({ page }) => {
		await page.goto('/planer');
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

	test('header cart opens inkop from mobile', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const mobileNav = page.locator('.main-nav-mobile');
		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav).toBeVisible();
		await expect(bottomNav.locator('a[href="/inkop"]')).toHaveCount(0);

		await mobileNav.getByTestId('nav-shopping').click();
		await expect(page).toHaveURL(/\/inkop/);
	});

	test('mobile bottom nav has exactly four primary tabs', async ({ page }) => {
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const bottomNav = page.getByRole('navigation', { name: /Mobil/i });
		await expect(bottomNav.locator('a.nav-tab')).toHaveCount(4);
		await expect(bottomNav.getByTestId('nav-scan')).toBeVisible();
		await expect(bottomNav.getByTestId('nav-pantry')).toBeVisible();
		await expect(bottomNav.getByTestId('nav-eat')).toBeVisible();
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
