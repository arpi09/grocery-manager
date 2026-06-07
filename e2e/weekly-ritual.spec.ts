import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';

test.describe('Weekly ritual — vecka', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/planer/vecka');
		await dismissOnboardingModalIfOpen(page);
		await dismissPostOnboardingSurveyIfOpen(page);
		await dismissPageHintIfOpen(page);
	});

	test('generate shows meal suggestions with mock AI', async ({ page }) => {
		const generateBtn = page.getByRole('button', { name: /Generera veckoförslag/i });
		await expect(generateBtn).toBeVisible({ timeout: 15_000 });
		await generateBtn.click();

		await expect(page.getByRole('heading', { name: 'E2E Testpasta' })).toBeVisible({
			timeout: 20_000
		});
		await expect(page.getByRole('button', { name: /Godkänn veckan/i })).toBeVisible();
	});
});
