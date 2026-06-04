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

	async function openRecipeAssistant(page: import('@playwright/test').Page) {
		await page.getByTestId('recipe-ideas-btn').filter({ visible: true }).first().click();
		const dialog = page.getByRole('dialog', { name: 'Receptförslag' });
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		await expect(dialog).toBeInViewport();
		return dialog;
	}

	test('header button opens modal and generate returns recipes', async ({ page }) => {
		const dialog = await openRecipeAssistant(page);

		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });
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

		const dialog = await openRecipeAssistant(page);
		await expect(dialog.getByRole('button', { name: 'Generera recept' })).toBeEnabled();
	});
});
