import { test, expect } from '@playwright/test';

import {
	completeActivationFinish,
	dismissOnboardingModalIfOpen,
	expectActivationScreenHeading,
	expectOnboardingGuideVisible,
	loginAsAdmin,
	loginWithCredentials,
	registerNewUser,
	waitForWelcomeParamStripped
} from './helpers/auth';

const WELCOME_HEADING = /Welcome to Skaffu|Välkommen till Skaffu/i;
const FILL_HEADING = /What do you have at home|Vad har ni hemma/i;
const INVITE_HEADING = /Do you shop together|Handlar ni ihop/i;
const FINISH_HEADING = /list is waiting|listan väntar/i;

import { createFridgeItemViaApi } from './helpers/inventory';
import { expectHomeDashboardVisible } from './helpers/home';

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

	test('activation onboarding primary CTA visible without scroll on mobile @deploy-critical', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);

		const modal = page.getByTestId('activation-onboarding');
		const fitsWelcome = await modal.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
		expect(fitsWelcome).toBe(true);

		const cta = page.getByTestId('activation-cta-primary');
		await expect(cta).toBeVisible();

		const box = await cta.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.y + box.height).toBeLessThanOrEqual(844);
		}

		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, FILL_HEADING);
		const fitsFill = await modal.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
		expect(fitsFill).toBe(true);
	});

	test('activation onboarding preview revisits completed step @deploy-critical', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, FILL_HEADING);

		await page.getByTestId('activation-progress-welcome').click();
		await expectActivationScreenHeading(page, WELCOME_HEADING);
		await expect(page.getByTestId('activation-cta-secondary')).toHaveCount(0);

		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, FILL_HEADING);
		await expect(page.getByTestId('activation-receipt-link')).toBeVisible();
	});

	test('activation onboarding receipt pivot resumes seeded and lands on inkop @deploy-critical', async ({
		page
	}) => {
		// Mobile viewport: on short desktop viewports the receipt link at the bottom of the
		// chips scroller is clipped under the modal footer and cannot be clicked.
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
		await expectActivationScreenHeading(page, WELCOME_HEADING);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, FILL_HEADING);

		// Receipt pivot closes the modal and opens the scanner.
		await page.getByTestId('activation-receipt-link').click();
		await expect(page).toHaveURL(/\/scan\?.*mode=receipt/);
		await expect(page.getByTestId('activation-onboarding')).toBeHidden();

		const itemName = `E2E activation ${Date.now()}`;
		await createFridgeItemViaApi(page, itemName);

		// Single goto: the fresh-user init script wipes onboarding keys on full loads,
		// so the flow restarts at welcome — but the seeded inventory makes derive skip fill.
		await page.goto('/hem');
		await expect(page.getByTestId('activation-onboarding')).toBeVisible({ timeout: 20_000 });
		await expectActivationScreenHeading(page, WELCOME_HEADING);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, INVITE_HEADING);

		await page.getByTestId('activation-cta-secondary').click();
		await expectActivationScreenHeading(page, FINISH_HEADING);
		await expect(page.getByTestId('activation-recap-seed')).toBeVisible();
		const modal = page.getByTestId('activation-onboarding');
		const fitsFinish = await modal.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
		expect(fitsFinish).toBe(true);

		await completeActivationFinish(page);
		await expect(page).toHaveURL(/\/inkop(?:\?quick=1)?$/);
	});

	test('cold home shows the v2 briefing for a fresh household', async ({ page }) => {
		await registerNewUser(page);
		await dismissOnboardingModalIfOpen(page);
		await page.goto('/hem');
		await expectHomeDashboardVisible(page);
	});

	test('scan from header nav opens scan hub', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('.main-nav-desktop').getByTestId('nav-scan').click();
		await expect(page).toHaveURL(/\/scan.*mode=hub/);
		await expect(page.getByTestId('scan-mode-hub')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('scan-hub-photo')).toBeVisible();
	});

	test('onboarding replay opens activation checklist not carousel', async ({ page }) => {
		await registerNewUser(page);
		await page.goto('/settings/app');
		await dismissOnboardingModalIfOpen(page);
		await page.locator('#settings-app details.settings-disclosure summary').click({ force: true });
		await dismissOnboardingModalIfOpen(page);
		await page.getByRole('button', { name: /Starta guide|Start guide/i }).click({ force: true });
		await expectOnboardingGuideVisible(page);
		// v8 progress dots: welcome/fill/invite/finish — no legacy carousel controls.
		await expect(page.getByTestId('activation-progress-fill')).toBeVisible();
		await expect(page.getByTestId('activation-progress-finish')).toBeVisible();
		await expect(page.getByTestId('onboarding-next')).toHaveCount(0);
		await expect(page.getByTestId('onboarding-path-photo')).toHaveCount(0);
	});
});
