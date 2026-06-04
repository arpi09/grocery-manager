import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { mockRecipeSuggestionsApi } from './helpers/mock-api';

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

	const dialog = page.getByTestId('recipe-assistant-dialog');
	await expect(async () => {
		await openBtn.click();
		await expect(dialog).toBeVisible({ timeout: 3_000 });
	}).toPass({ timeout: 20_000 });
	await expect(dialog).toBeInViewport();
	return dialog;
}

test.describe('Recipe assistant from header', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await mockRecipeSuggestionsApi(page);
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
	});

	test('header button opens modal and generate returns recipes', async ({ page }) => {
		const dialog = await openRecipeAssistant(page);

		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });
		await expect(generateBtn).toBeEnabled();
		await generateBtn.click();

		await expect(dialog.getByRole('heading', { name: 'E2E Testpasta' })).toBeVisible({
			timeout: 20_000
		});
		const meta = dialog.getByLabel('Receptsammanfattning');
		await expect(meta).toContainText('2 steg');
		await expect(meta).toContainText('4 portioner');
		await expect(dialog.getByText('Koka pastan.')).toBeVisible();
	});

});

test.describe('Recipe assistant mobile', () => {
	test.use({ viewport: { width: 390, height: 844 } });
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await mockRecipeSuggestionsApi(page);
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
	});

	test('header button opens modal on screen', async ({ page }) => {
		const dialog = await openRecipeAssistant(page);
		await expect(dialog.getByRole('button', { name: 'Generera recept' })).toBeEnabled();
	});
});
