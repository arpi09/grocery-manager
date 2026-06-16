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
	test.describe.configure({ mode: 'serial', timeout: 120_000 });

	test('register creates account with captcha bypass and lands on hem welcome @deploy-critical', async ({ page }) => {

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

		await expect(
			page.getByRole('dialog', { name: /Introduktion till Skaffu|Introduction to Skaffu/i })
		).toBeHidden();

	});



	test('onboarding opens shopping list without scan modal @deploy-critical', async ({ page }) => {

		await registerNewUser(page);

		await page.goto('/settings#settings-app');

		await dismissOnboardingModalIfOpen(page);

		await expect(page).toHaveURL(/\/settings/);

		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click({ force: true });

		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		await page.getByTestId('onboarding-next').click();
		await expectOnboardingStepVisible(page, 2);
		await page.getByTestId('onboarding-next').click();
		await expectOnboardingStepVisible(page, 3);
		await page.getByTestId('onboarding-finish').click();

		await expect(page).toHaveURL(/\/inkop(?:\?quick=1)?$/);

		await expect(page.getByTestId('photo-round-capture')).toHaveCount(0);

	});



	test('home has at most one primary CTA above the fold', async ({ page }) => {

		await loginAsAdmin(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

		const home = page.locator('section.home');

		await expect(home).toBeVisible();

		const primaryActions = home.locator('.scan-cta, .btn-primary.action-link');

		expect(await primaryActions.count()).toBeLessThanOrEqual(1);

	});



	test('cold home shows lista CTA without empty section headings', async ({ page }) => {

		await registerNewUser(page);

		await dismissOnboardingModalIfOpen(page);

		await page.goto('/hem');

		await expect(page.locator('[data-home-state="cold"]')).toBeVisible();

		await expect(page.getByTestId('home-hero')).toBeVisible();

		await expect(page.getByRole('link', { name: /Skapa veckans lista|Create this week's list/i })).toBeVisible();

		await expect(page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })).toHaveCount(0);

		await expect(page.getByRole('heading', { name: /Hur mår hushållet|How's the household/i })).toHaveCount(0);

	});



	test('home minimal shows hero without legacy sections', async ({ page }) => {

		await loginAsAdmin(page);

		await ensureFridgeInventoryItem(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('home-hero')).toBeVisible();
		await expect(page.locator('.home-v3-section')).toHaveCount(0);
		await expect(page.getByRole('heading', { name: /Vad rekommenderar|What does Skaffu recommend/i })).toHaveCount(0);

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
		await expect(hub.getByTestId('scan-hub-receipt')).toBeVisible();
		await expect(page.getByRole('navigation', { name: /Skanningslägen|Scan modes/i })).toHaveCount(0);
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
		await expect(page.getByText(/Avbryt och gå tillbaka|Cancel and go back/i)).toHaveCount(0);
	});



	test('onboarding finish returns to hem dashboard', async ({ page }) => {

		await registerNewUser(page);

		await page.goto('/settings#settings-app');

		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click({ force: true });
		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		await page.getByTestId('onboarding-next').click();
		await page.getByTestId('onboarding-next').click();
		await page.getByTestId('onboarding-finish').click();
		await dismissOnboardingModalIfOpen(page);

		for (let i = 0; i < 3; i++) {
			const itemName = `E2E onboard ${i} ${Date.now()}`;
			await page.locator('#shopping-name').fill(itemName);
			const addButton = page.locator('form.add-form').getByRole('button', { name: /Lägg till|Add/i });
			await Promise.all([
				page.waitForResponse(
					(res) => res.url().includes('/inkop') && res.request().method() === 'POST' && res.ok(),
					{ timeout: 15_000 }
				),
				addButton.click({ force: true })
			]);
			await expect(page.getByText(itemName)).toBeVisible();
		}

		await expect(page).toHaveURL(/\/inkop/, { timeout: 15_000 });

	});



	test('onboarding 15s has no pantry path picker', async ({ page }) => {

		await registerNewUser(page);

		await dismissOnboardingModalIfOpen(page);

		await page.goto('/settings#settings-app');

		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click({ force: true });

		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });

		await expectOnboardingGuideVisible(page);

		await expect(page.getByTestId('onboarding-next')).toBeVisible();
		await expect(page.getByTestId('onboarding-path-photo')).toHaveCount(0);

	});

});
