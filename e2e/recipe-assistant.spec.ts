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

	await page.goto('/planer');
	await dismissOnboardingModalIfOpen(page);

	const openBtn = page.getByTestId('eat-hub-generate');
	await expect(openBtn).toBeVisible({ timeout: 15_000 });
	await openBtn.scrollIntoViewIfNeeded();

	const dialog = page.getByTestId('recipe-assistant-dialog');
	await expect(async () => {
		await openBtn.click({ force: true });
		await expect(dialog).toBeVisible({ timeout: 3_000 });
	}).toPass({ timeout: 20_000 });
	await expect(dialog).toBeInViewport();

	return dialog;
}



test.describe('Recipe assistant from header', () => {

	test.setTimeout(60_000);



	test.beforeEach(async ({ page }) => {

		await loginAsAdmin(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

	});



	test('back from recipe detail restores generated list in modal', async ({ page }) => {

		const dialog = await openRecipeAssistant(page);

		await dialog.getByRole('button', { name: 'Generera recept' }).click();

		const openBtn = dialog.getByTestId('recipe-open-btn');

		await expect(openBtn).toBeVisible({ timeout: 20_000 });

		await openBtn.click();

		await expect(page).toHaveURL(/\/recept\/.+\?from=recipe-assistant/);

		await page.getByTestId('recipe-detail-back').click();

		await expect(page).toHaveURL('/hem');

		const restoredDialog = page.getByTestId('recipe-assistant-dialog');

		await expect(restoredDialog).toBeVisible();

		await expect(restoredDialog.getByTestId('recipe-result-list')).toBeVisible();

		await expect(restoredDialog.getByTestId('recipe-open-btn')).toBeVisible();

	});



	test('generate opens recipe detail and cook mode steps', async ({ page }) => {

		const dialog = await openRecipeAssistant(page);



		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });

		await expect(generateBtn).toBeEnabled();

		await generateBtn.click();



		const openBtn = dialog.getByTestId('recipe-open-btn');

		await expect(openBtn).toBeVisible({ timeout: 20_000 });

		await openBtn.click();



		await expect(page).toHaveURL(/\/recept\/.+/);

		await expect(page.getByTestId('recipe-detail')).toBeVisible();

		await expect(page.getByRole('heading', { name: 'E2E Testpasta' })).toBeVisible();

		await expect(page.getByText('Koka pastan enligt förpackningen.')).toBeVisible();



		await page.getByTestId('recipe-start-cooking').click();

		await expect(page).toHaveURL(/\/recept\/.+\/laga/);

		await expect(page.getByTestId('recipe-cook-mode')).toBeVisible();

		await expect(page.getByText('Koka pastan enligt förpackningen.')).toBeVisible();



		await page.getByTestId('cook-next').click();

		await expect(page.getByText('Blanda och servera med sås.')).toBeVisible();

		await expect(page.getByText('Steg 2 av 2')).toBeVisible();

	});

});



test.describe('Recipe assistant mobile', () => {

	test.use({ viewport: { width: 390, height: 844 } });

	test.setTimeout(60_000);



	test.beforeEach(async ({ page }) => {

		await loginAsAdmin(page);

		await page.goto('/hem');

		await dismissOnboardingModalIfOpen(page);

	});



	test('header button opens modal on screen', async ({ page }) => {

		const dialog = await openRecipeAssistant(page);

		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });

		await expect(generateBtn).toBeEnabled();

		await expect(generateBtn).toBeInViewport();

	});



	test('generate shows open links with touch-friendly controls', async ({ page }) => {

		const dialog = await openRecipeAssistant(page);

		const generateBtn = dialog.getByRole('button', { name: 'Generera recept' });

		await generateBtn.click();



		const openBtn = dialog.getByTestId('recipe-open-btn');

		await expect(openBtn).toBeVisible({ timeout: 20_000 });

		await expect(openBtn).toBeInViewport();



		const addMissing = dialog.getByRole('button', { name: /Lägg på lista|Lägg alla saknade/i });

		await expect(addMissing.first()).toBeVisible();

		await expect(addMissing.first()).toBeInViewport();

	});



	test('cook mode footer buttons meet touch target on mobile', async ({ page }) => {

		const dialog = await openRecipeAssistant(page);

		await dialog.getByRole('button', { name: 'Generera recept' }).click();

		await dialog.getByTestId('recipe-open-btn').click({ timeout: 20_000 });



		await page.getByTestId('recipe-start-cooking').click();

		const nextBtn = page.getByTestId('cook-next');

		await expect(nextBtn).toBeInViewport();

		const box = await nextBtn.boundingBox();

		expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

	});

});


