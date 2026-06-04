import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';
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
		await dismissOnboardingModalIfOpen(page);
		await dismissPostOnboardingSurveyIfOpen(page);
		await expect(page.locator('.modal-root')).toHaveCount(0, { timeout: 10_000 });

		const viewport = page.viewportSize();
		const isMobile = viewport != null && viewport.width < 900;
		const openBtn = isMobile
			? page.locator('.mobile-header-actions').getByTestId('recipe-ideas-btn')
			: page.locator('.main-nav-desktop').getByTestId('recipe-ideas-btn');
		await expect(openBtn).toBeVisible({ timeout: 15_000 });
		await openBtn.scrollIntoViewIfNeeded();
		await openBtn.click();

		const dialog = page.getByTestId('recipe-assistant-dialog');
		await expect(dialog).toBeVisible({ timeout: 20_000 });
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
		await dismissPostOnboardingSurveyIfOpen(page);

		const dialog = await openRecipeAssistant(page);
		await expect(dialog.getByRole('button', { name: 'Generera recept' })).toBeEnabled();
	});
});
