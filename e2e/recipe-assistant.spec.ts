import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { mockRecipeSuggestionsApi } from './helpers/mock-api';

test.describe('Recipe assistant from header', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await mockRecipeSuggestionsApi(page);
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
	});

	test('header button opens modal and generate returns recipes', async ({ page }) => {
		await page.getByRole('button', { name: /Öppna receptidéer/i }).click();

		const dialog = page.getByRole('dialog', { name: 'Receptförslag' });
		await expect(dialog).toBeVisible();
		await expect(dialog).toBeInViewport();

		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });
		await expect(generateBtn).toBeVisible();
		await expect(generateBtn).toBeEnabled();
		await generateBtn.click();

		await expect(dialog.getByRole('heading', { name: 'E2E Testpasta' })).toBeVisible({
			timeout: 20_000
		});
	});

	test('mobile header button opens modal on screen', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		await page.getByRole('button', { name: /Öppna receptidéer/i }).click();

		const dialog = page.getByRole('dialog', { name: 'Receptförslag' });
		await expect(dialog).toBeVisible();
		await expect(dialog).toBeInViewport();
		await expect(dialog.getByRole('button', { name: 'Generera recept' })).toBeEnabled();
	});
});
