import { test, expect } from '@playwright/test';

import {
	dismissOnboardingModalIfOpen,
	expectActivationScreenHeading,
	expectOnboardingGuideVisible,
	loginAsAdmin,
	loginWithCredentials,
	registerNewUser,
	waitForWelcomeParamStripped
} from './helpers/auth';

import { createFridgeItemViaApi, ensureFridgeInventoryItem } from './helpers/inventory';
import { expectHomeDashboardVisible, expectHomeRedesignVisible } from './helpers/home';

test.describe('Critical flows', () => {
	test.describe.configure({ mode: 'serial', timeout: 120_000 });

	test('register creates account with captcha bypass and lands on hem welcome @deploy-critical', async ({
		page
	}) => {
		await registerNewUser(page);
		await waitForWelcomeParamStripped(page);
		await expect(page).toHaveURL((url) => new URL(url).pathname === '/hem');
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
	});

	test('login redirects to /hem', async ({ page }) => {
		const { email, password } = await registerNewUser(page);
		await page.context().clearCookies();
		await loginWithCredentials(page, email, password);
		await expect(page).toHaveURL('/hem');
	});

	test('fresh registration does not reopen onboarding on scan', async ({ page }) => {
		await registerNewUser(page);
		await dismissOnboardingModalIfOpen(page);
		await page.goto('/scan?mode=photo');
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('activation-onboarding')).toBeHidden();
	});

	test('activation onboarding scan-first happy path @deploy-critical', async ({ page }) => {
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
		await expectActivationScreenHeading(page, /Welcome to Skaffu|Välkommen till Skaffu/i);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, /Start with one thing|Börja med en sak/i);
		await page.getByTestId('activation-cta-primary').click();
		await expect(page).toHaveURL(/\/scan(?:\?.*)?onboarding=activation/);
		const itemName = `E2E activation ${Date.now()}`;
		await createFridgeItemViaApi(page, itemName);
		await page.goto('/hem');
		await expect(page.getByTestId('activation-onboarding')).toBeVisible({ timeout: 20_000 });
		await expectActivationScreenHeading(page, /Looking good|Det här ser bra ut/i);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, /Skaffu remembers|kommer ihåg de små/i);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, /Shopping works better|Inköp fungerar bättre/i);
		await page.getByTestId('activation-cta-primary').click();
		await expect(page).toHaveURL(/\/inkop(?:\?quick=1)?$/);
	});

	test('home has at most one primary CTA above the fold', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		const home = page.locator('section.home');
		await expect(home).toBeVisible();
		const redesign = home.locator('.home-v5');
		if ((await redesign.count()) > 0) {
			const heroPrimary = home.getByTestId('home-hero').locator('.btn-primary');
			expect(await heroPrimary.count()).toBeLessThanOrEqual(1);
			return;
		}
		const primaryActions = home.locator('.scan-cta, .btn-primary.action-link');
		expect(await primaryActions.count()).toBeLessThanOrEqual(1);
	});

	test('cold home shows shopping entry without empty section headings', async ({ page }) => {
		await registerNewUser(page);
		await dismissOnboardingModalIfOpen(page);
		await page.goto('/hem');
		await expect(page.locator('.home-v5[data-home-state="cold"]')).toBeVisible();
		await expectHomeDashboardVisible(page);
		await expect(page.getByTestId('home-shopping-card')).toBeVisible();
		await expect(
			page.getByRole('link', { name: /Öppna inköpslistan|Open shopping list/i })
		).toBeVisible();
		await expect(
			page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })
		).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Hur mår hushållet|How's the household/i })
		).toHaveCount(0);
	});

	test('home minimal shows hero without legacy sections', async ({ page }) => {
		await loginAsAdmin(page);
		await ensureFridgeInventoryItem(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		await expectHomeRedesignVisible(page);
		await expect(page.locator('.home-v3-section')).toHaveCount(0);
		await expect(
			page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })
		).toHaveCount(0);
	});

	test('home expiring hint links to planer not recipe modal', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		const redesign = page.locator('.home-v5');
		if ((await redesign.count()) > 0) {
			test.skip(true, 'Home redesign v1 — planer link lives on inventory surfaces');
		}
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

	test('scan from header nav is kvitto-first not photo', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('.main-nav-desktop').getByTestId('nav-scan').click();
		await expect(page).toHaveURL(/\/scan(?:$|\?)/);
		await expect(page.getByTestId('photo-round-capture')).toHaveCount(0);
		const hub = page.getByTestId('scan-mode-hub');
		await expect(hub).toBeVisible({ timeout: 15_000 });
		await expect(hub.getByTestId('scan-hub-receipt')).toBeVisible();
		await expect(page.getByRole('navigation', { name: /Skanningslägen|Scan modes/i })).toHaveCount(0);
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
		await expect(page.getByText(/Avbryt och gå tillbaka|Cancel and go back/i)).toHaveCount(0);
	});

	test('onboarding replay opens activation checklist not carousel', async ({ page }) => {
		await registerNewUser(page);
		await page.goto('/settings/app');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click({ force: true });
		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });
		await expectOnboardingGuideVisible(page);
		await expect(page.getByTestId('activation-progress-firstScan')).toBeVisible();
		await expect(page.getByTestId('onboarding-next')).toHaveCount(0);
		await expect(page.getByTestId('onboarding-path-photo')).toHaveCount(0);
	});
});
