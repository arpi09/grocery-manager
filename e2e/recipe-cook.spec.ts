import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';

async function openRecipeAssistant(page: import('@playwright/test').Page) {
	await dismissOnboardingModalIfOpen(page);
	await dismissPostOnboardingSurveyIfOpen(page);
	await dismissPageHintIfOpen(page);
	await expect(page.locator('.modal-backdrop')).toHaveCount(0, { timeout: 10_000 });

	const openBtn = page.locator('.main-nav-desktop').getByTestId('recipe-ideas-btn');
	await expect(openBtn).toBeVisible({ timeout: 15_000 });
	await openBtn.scrollIntoViewIfNeeded();

	const dialog = page.getByTestId('recipe-assistant-dialog');
	await expect(async () => {
		await openBtn.click({ force: true });
		await expect(dialog).toBeVisible({ timeout: 3_000 });
	}).toPass({ timeout: 20_000 });

	return dialog;
}

test.describe('Recipe cook mode — deploy chain', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
	});

	test('generate navigates recept detail then laga steps', async ({ page }) => {
		const dialog = await openRecipeAssistant(page);

		await dialog.getByRole('button', { name: 'Generera recept' }).click();

		const openBtn = dialog.getByTestId('recipe-open-btn');
		await expect(openBtn).toBeVisible({ timeout: 20_000 });
		await openBtn.click();

		await expect(page).toHaveURL(/\/recept\/.+/);
		await expect(page.getByTestId('recipe-detail')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'E2E Testpasta' })).toBeVisible();

		await page.getByTestId('recipe-start-cooking').click();
		await expect(page).toHaveURL(/\/recept\/.+\/laga/);
		await expect(page.getByTestId('recipe-cook-mode')).toBeVisible();
		await expect(page.getByText('Koka pastan enligt förpackningen.')).toBeVisible();

		await page.getByTestId('cook-next').click();
		await expect(page.getByText('Blanda och servera med sås.')).toBeVisible();
		await expect(page.getByText('Steg 2 av 2')).toBeVisible();
	});
});
