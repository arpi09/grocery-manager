import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import {
	completeActivationFinish,
	expectActivationScreenHeading,
	expectOnboardingGuideVisible,
	registerNewUser
} from './helpers/auth';
import { AXE_WCAG_TAGS } from './helpers/axe';

const WELCOME_HEADING = /Welcome to Skaffu|Välkommen till Skaffu/i;
const FILL_HEADING = /What do you have at home|Vad har ni hemma/i;
const INVITE_HEADING = /Do you shop together|Handlar ni ihop/i;
const FINISH_HEADING = /list is waiting|listan väntar/i;

/** welcome → fill. Fresh-user trap: no reload/goto — init script wipes onboarding keys. */
async function advanceToFill(page: Page) {
	await expectOnboardingGuideVisible(page);
	await expectActivationScreenHeading(page, WELCOME_HEADING);
	await page.getByTestId('activation-cta-primary').click();
	await expectActivationScreenHeading(page, FILL_HEADING);
}

/** fill → invite by submitting the preselected staples. */
async function submitStaples(page: Page) {
	await expect(page.getByTestId('activation-cta-primary')).toHaveText(
		/Lägg till \d+ varor|Add \d+ items/i
	);
	await page.getByTestId('activation-cta-primary').click();
	await expectActivationScreenHeading(page, INVITE_HEADING);
}

test.describe('Activation onboarding v8 navigation', () => {
	test.describe.configure({ mode: 'serial', timeout: 120_000 });

	test('happy path: welcome → fill staples → invite skip → finish opens inkop quick-add @deploy-critical', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await advanceToFill(page);

		await expect(page.getByTestId('activation-staple-chip').first()).toBeVisible();
		await submitStaples(page);

		// Solo household — "Jag handlar själv" advances directly to finish.
		await page.getByTestId('activation-cta-secondary').click();
		await expectActivationScreenHeading(page, FINISH_HEADING);
		await expect(page.getByTestId('activation-recap-seed')).toBeVisible();

		await completeActivationFinish(page);
		await expect(page).toHaveURL(/\/inkop(?:\?quick=1)?$/, { timeout: 20_000 });
		await expect(page.getByTestId('shopping-v2-quick-add')).toBeVisible({ timeout: 20_000 });
		await expect(page.getByTestId('activation-onboarding')).toBeHidden();
	});

	test('fill "maybe later" closes the modal', async ({ page }) => {
		await registerNewUser(page);
		await advanceToFill(page);

		await page.getByTestId('activation-cta-secondary').click();
		await expect(page.getByTestId('activation-onboarding')).toBeHidden();
	});

	test('fill receipt link navigates to scan and closes the modal', async ({ page }) => {
		// Mobile viewport: on short desktop viewports the bottom of the chips scroller
		// (incl. the receipt link) is clipped under the modal footer — see PR notes.
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await advanceToFill(page);

		await page.getByTestId('activation-receipt-link').click();
		await expect(page).toHaveURL(/\/scan\?.*mode=receipt/);
		await expect(page.getByTestId('activation-onboarding')).toBeHidden();
	});

	test('progress dot previews completed step and Continue returns @deploy-critical', async ({
		page
	}) => {
		await registerNewUser(page);
		await advanceToFill(page);

		await page.getByTestId('activation-progress-welcome').click();
		await expectActivationScreenHeading(page, WELCOME_HEADING);

		// Preview mode: single "Fortsätt" CTA, no secondary.
		const continueCta = page.getByTestId('activation-cta-primary');
		await expect(continueCta).toHaveText(/Fortsätt|Continue/i);
		await expect(page.getByTestId('activation-cta-secondary')).toHaveCount(0);

		await continueCta.click();
		await expectActivationScreenHeading(page, FILL_HEADING);
	});

	test('invite share falls back to clipboard copy and auto-advances', async ({
		page,
		context
	}) => {
		// Headless Chromium has no navigator.share — the flow copies the invite link instead.
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await registerNewUser(page);
		await advanceToFill(page);
		await submitStaples(page);

		await page.getByTestId('activation-cta-primary').click();
		await expect(page.getByTestId('activation-cta-primary')).toHaveText(
			/Länk kopierad|Link copied/i,
			{ timeout: 10_000 }
		);

		// Auto-advance ~1.2s after the copy confirmation.
		await expectActivationScreenHeading(page, FINISH_HEADING);
		await expect(page.getByTestId('activation-recap-invite')).toBeVisible();

		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toContain('/invite/');
	});

	test('fill screen fits mobile viewport without modal-body scroll @deploy-critical', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await registerNewUser(page);
		await advanceToFill(page);
		await expect(page.getByTestId('activation-staple-chip').first()).toBeVisible();

		// The chips area (.fill-extra) may scroll internally — the modal body itself must not.
		const modalBody = page.locator('[data-testid="activation-onboarding"] .modal-body');
		const bodyFits = await modalBody.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
		expect(bodyFits).toBe(true);

		const cta = page.getByTestId('activation-cta-primary');
		await expect(cta).toBeVisible();
		const box = await cta.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.y + box.height).toBeLessThanOrEqual(844);
		}
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
