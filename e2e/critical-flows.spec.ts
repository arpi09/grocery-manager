import { test, expect } from '@playwright/test';

import {


	dismissOnboardingModalIfOpen,

	expectOnboardingGuideVisible,

	expectOnboardingStepVisible,

	loginAsAdmin,

	loginWithCredentials,

	registerNewUser,

	waitForWelcomeParamStripped

} from './helpers/auth';

import { ensureFridgeInventoryItem } from './helpers/inventory';



test.describe('Critical flows', () => {

	test('register creates account with captcha bypass and lands on hem welcome @deploy-critical', async ({ page }) => {

		test.setTimeout(60_000);

		await registerNewUser(page);

		await waitForWelcomeParamStripped(page);

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



	test('fresh registration does not reopen onboarding on scan', async ({ page }) => {

		await registerNewUser(page);

		await dismissOnboardingModalIfOpen(page);

		await page.goto('/scan?mode=photo');

		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });

		await expect(
			page.getByRole('dialog', { name: /Introduktion till Skaffu|Introduction to Skaffu/i })
		).toBeHidden();

	});



	test('onboarding opens shopping list without scan modal @deploy-critical', async ({ page }) => {

		test.setTimeout(60_000);

		await registerNewUser(page);

		await page.goto('/settings#settings-app');

		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/settings/);

		await page.locator('#settings-app details.settings-disclosure summary').click();

		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		await page.getByTestId('onboarding-path-shopping').click();

		await expectOnboardingStepVisible(page, 2);

		await page.getByTestId('onboarding-begin-path').click();

		await expect(page).toHaveURL(/\/inkop(?:\?quick=1)?$/);

		await expect(page.getByTestId('photo-round-capture')).toHaveCount(0);

	});



	test('home has at most one primary CTA above the fold', async ({ page }) => {

		await loginAsAdmin(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

		const home = page.locator('section.home');

		await expect(home).toBeVisible();

		const primaryActions = home.locator('.cta-primary, .action-primary, .shopping-teaser-primary');

		await expect(primaryActions).toHaveCount(1);

	});



	test('cold home shows lista CTA without empty section headings', async ({ page }) => {

		await registerNewUser(page);

		await dismissOnboardingModalIfOpen(page);

		await page.goto('/hem');

		await expect(page.locator('[data-home-state="cold"]')).toBeVisible();

		await expect(page.locator('.home-v3-section')).toHaveCount(1);

		await expect(page.getByRole('link', { name: /Skapa veckans lista|Create this week's list/i })).toBeVisible();

		await expect(page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })).toHaveCount(0);

		await expect(page.getByRole('heading', { name: /Hur mår hushållet|How's the household/i })).toHaveCount(0);

	});



	test('home V3 shows sections without Mer på hem', async ({ page }) => {

		await loginAsAdmin(page);

		await ensureFridgeInventoryItem(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

		await expect(page.locator('.more-on-home')).toHaveCount(0);

		expect(await page.locator('.home-v3-section').count()).toBe(3);

		await expect(page.getByRole('heading', { name: /Vad ska vi handla|What should we shop/i })).toBeVisible();

		await expect(page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })).toBeVisible();

		await expect(page.getByRole('heading', { name: /Hur mår hushållet|How's the household/i })).toBeVisible();

		await expect(page.locator('.shopping-teaser-primary, .action-primary')).toBeVisible();

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



	test('scan from header nav is kvitto-first not photo', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('.main-nav-desktop').getByTestId('nav-scan').click();
		await expect(page).toHaveURL(/\/scan(?:$|\?)/);
		await expect(page.getByTestId('photo-round-capture')).toHaveCount(0);
		const hub = page.getByTestId('scan-mode-hub');
		await expect(hub).toBeVisible({ timeout: 15_000 });
		await expect(hub.getByTestId('scan-hub-receipt-hero')).toBeVisible();
		await expect(page.getByRole('navigation', { name: /Skanningslägen|Scan modes/i })).toHaveCount(0);
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
		await expect(page.getByText(/Avbryt och gå tillbaka|Cancel and go back/i)).toHaveCount(0);
	});



	test('onboarding finish returns to hem dashboard', async ({ page }) => {

		test.setTimeout(60_000);

		await registerNewUser(page);

		await page.goto('/settings#settings-app');

		await dismissOnboardingModalIfOpen(page);

		await page.locator('#settings-app details.settings-disclosure summary').click();

		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		await page.getByTestId('onboarding-path-shopping').click();

		await expectOnboardingStepVisible(page, 2);

		await page.getByTestId('onboarding-begin-path').click();
		await dismissOnboardingModalIfOpen(page);

		for (let i = 0; i < 3; i++) {
			await page.locator('#shopping-name').fill(`E2E onboard ${i} ${Date.now()}`);
			await page.locator('form.add-form').getByRole('button', { name: /Lägg till|Add/i }).click();
		}

		await page.goto('/settings#settings-app');
		await page.locator('#settings-app details.settings-disclosure summary').click();
		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expect(page.getByTestId('onboarding-finish')).toBeVisible({ timeout: 30_000 });
		await page.getByTestId('onboarding-finish').click();

		await expect(page).toHaveURL('/hem');

	});



	test('welcome shows shopping list as primary CTA not photo', async ({ page }) => {

		await registerNewUser(page);

		await dismissOnboardingModalIfOpen(page);

		await page.goto('/settings#settings-app');

		await page.locator('#settings-app details.settings-disclosure summary').click();

		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		const shoppingPrimary = page.getByTestId('onboarding-path-shopping');

		await expect(shoppingPrimary).toBeVisible();

		await expect(shoppingPrimary).toHaveClass(/btn-primary/);

		await expect(page.getByTestId('onboarding-path-photo')).not.toBeVisible();

		await page.locator('.pantry-secondary summary').click();

		await expect(page.getByTestId('onboarding-path-photo')).toBeVisible();

	});

});
