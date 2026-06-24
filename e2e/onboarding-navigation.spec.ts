import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import {
	expectActivationScreenHeading,
	expectOnboardingGuideVisible,
	registerNewUser
} from './helpers/auth';
import { createFridgeItemViaApi } from './helpers/inventory';
import { AXE_WCAG_TAGS } from './helpers/axe';

async function expectNoModalScroll(page: import('@playwright/test').Page) {
	const modal = page.getByTestId('activation-onboarding');
	await expect(modal).toBeVisible();
	const fits = await modal.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
	expect(fits).toBe(true);
}

test.describe('Activation onboarding navigation', () => {
	test.describe.configure({ mode: 'serial', timeout: 120_000 });

	test('back and forward nav moves between steps without overlap @deploy-critical', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);

		await page.getByTestId('activation-nav-forward').click();
		await expectActivationScreenHeading(page, /Import a receipt|Importera ett kvitto/i);

		await page.getByTestId('activation-nav-back').click();
		await expectActivationScreenHeading(page, /Welcome to Skaffu|Välkommen till Skaffu/i);

		const progressOverlap = await page.evaluate(() => {
			const progress = document.querySelector('[data-testid="activation-progress-counter"]');
			const title = document.querySelector('.screen-title');
			if (!progress || !title) return false;
			const progressBox = progress.getBoundingClientRect();
			const titleBox = title.getBoundingClientRect();
			return progressBox.bottom > titleBox.top + 2;
		});
		expect(progressOverlap).toBe(false);
	});

	test('progress path selects earlier completed step @deploy-critical', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, /Import a receipt|Importera ett kvitto/i);

		await page.getByTestId('activation-progress-welcome').click();
		await expectActivationScreenHeading(page, /Welcome to Skaffu|Välkommen till Skaffu/i);
		await expect(page.getByTestId('activation-cta-primary')).toBeVisible();
	});

	test('shopping step fits viewport without scroll @deploy-critical', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await expectOnboardingGuideVisible(page);
		await page.getByTestId('activation-cta-primary').click();
		await page.getByTestId('activation-cta-primary').click();
		await expect(page).toHaveURL(/\/scan(?:\?.*)?mode=receipt/);
		await createFridgeItemViaApi(page, `E2E nav ${Date.now()}`);
		await page.goto('/hem');
		await expect(page.getByTestId('activation-onboarding')).toBeVisible({ timeout: 20_000 });
		await page.getByTestId('activation-cta-primary').click();
		await page.getByTestId('activation-cta-primary').click();
		await expectActivationScreenHeading(page, /Shop together|Inköp tillsammans/i);
		await expectNoModalScroll(page);
	});
});

test('LearningAiBadge on /brand passes axe color-contrast @deploy-critical', async ({ page }) => {
	await page.goto('/brand');
	await expect(page.getByTestId('learning-ai-badge').first()).toBeVisible();

	const results = await new AxeBuilder({ page })
		.withTags([...AXE_WCAG_TAGS])
		.include('[data-testid="learning-ai-badge"]')
		.analyze();

	const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
	expect(contrastViolations).toHaveLength(0);
});
