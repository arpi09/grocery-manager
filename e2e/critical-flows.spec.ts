import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	expectOnboardingGuideVisible,
	loginAsAdmin,
	loginWithCredentials,
	registerNewUser
} from './helpers/auth';

test.describe('Critical flows', () => {
	test('register creates account with captcha bypass and lands on home', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL('/hem');
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
	});

	test('login redirects to /hem', async ({ page }) => {
		const { email, password } = await registerNewUser(page);
		await page.context().clearCookies();

		await loginWithCredentials(page, email, password);
		await expect(page).toHaveURL('/hem');
	});

	test('fresh registration skips auto-open onboarding modal on home', async ({ page }) => {
		await registerNewUser(page);
		await expect(page).toHaveURL('/hem');
		await expect(
			page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
		).toHaveCount(0);
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
		).toHaveCount(0);
	});

	test('onboarding embedded scan opens picker without navigation', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await page.goto('/settings#settings-app');
		await dismissOnboardingModalIfOpen(page);
		await expect(page).toHaveURL(/\/settings/);
		await page.locator('#settings-app details.settings-disclosure summary').click();
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click();
		await expectOnboardingGuideVisible(page);
		await page.getByRole('button', { name: /Nästa|Next/i }).click();
		await expect(page.getByText(/Steg 2 av 3/i)).toBeVisible();
		await page.getByTestId('onboarding-choose-barcode').click();
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toBeVisible();
		await expect(page).toHaveURL(/\/settings/);
		await expect(page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu|Welcome to Skaffu/i })).toHaveCount(0);
	});

	test('home has at most one primary CTA above the fold', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		const home = page.locator('section.home');
		await expect(home).toBeVisible();
		const primaryActions = home.locator('.cta-primary, .action-primary');
		await expect(primaryActions).toHaveCount(1);
	});

	test('home expiring hint links to planer not recipe modal', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const planerLink = page.getByTestId('home-planer-link');
		if ((await planerLink.count()) === 0) {
			test.skip(true, 'No expiring items in seed — planer link not shown');
		}

		await expect(planerLink).toHaveAttribute('href', '/planer');
		await expect(planerLink).toBeVisible();
		await expect(page.getByTestId('home-primary-cta')).not.toContainText(
			/Generera middag|Generate dinner/i
		);
	});

	test('scan tab opens photo mode by default', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		const scanNav = page.getByTestId('nav-scan').filter({ visible: true }).first();
		await scanNav.click();
		await expect(page).toHaveURL(/\/scan(?:$|\?)/);
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
		await expect(page.getByText(/Avbryt och gå tillbaka|Cancel and go back/i)).toHaveCount(0);
	});

	test('onboarding scan cancel returns to guide without leaving settings', async ({ page }) => {
		test.setTimeout(60_000);
		await registerNewUser(page);
		await page.goto('/settings#settings-app');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click();
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click();
		await expectOnboardingGuideVisible(page);
		await page.getByRole('button', { name: /Nästa|Next/i }).click();
		await page.getByTestId('onboarding-choose-barcode').click();
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('heading', { name: /Streckkod|Barcode/i })).toHaveCount(0);
		await expect(page.getByText(/Steg 2 av 3|Step 2 of 3/i)).toBeVisible();
		await expect(page).toHaveURL(/\/settings/);
	});
});
