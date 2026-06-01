import { test, expect, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

const E2E_SECOND_PANTRY = 'E2E Testhem';

async function openPantrySwitcher(page: Page) {
	const trigger = page.getByRole('button', { name: /Byt pantry/i }).first();
	await expect(trigger).toBeVisible();
	await trigger.click();

	const menu = page
		.getByRole('dialog', { name: /Byt pantry/i })
		.or(page.getByRole('listbox', { name: /Dina pantries/i }));
	await expect(menu).toBeVisible();
}

async function ensureSecondPantry(page: Page) {
	await openPantrySwitcher(page);

	const secondOption = page
		.getByRole('option', { name: E2E_SECOND_PANTRY })
		.or(page.getByRole('button', { name: E2E_SECOND_PANTRY, exact: true }));
	if (await secondOption.first().isVisible().catch(() => false)) {
		return;
	}

	await page.getByRole('button', { name: /Skapa ny pantry/i }).click();
	await page.locator('input[name="name"]').fill(E2E_SECOND_PANTRY);
	await page.getByRole('button', { name: /^Skapa$/i }).click();
	await expect(
		page.getByRole('button', { name: new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`) })
	).toBeVisible({ timeout: 15_000 });
}

async function switchToPantry(page: Page, name: string) {
	await openPantrySwitcher(page);
	await page
		.getByRole('option', { name })
		.or(page.getByRole('button', { name, exact: true }))
		.first()
		.click();
	await expect(
		page.getByRole('button', { name: new RegExp(`Byt pantry, nuvarande: ${name}`) })
	).toBeVisible({ timeout: 15_000 });
}

test.describe('Household switcher', () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('switches pantry from a non-home page (desktop)', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		const initialTrigger = page.getByRole('button', { name: /Byt pantry, nuvarande:/i }).first();
		const initialName = (await initialTrigger.getAttribute('aria-label'))?.replace(
			/^Byt pantry, nuvarande: /,
			''
		);
		expect(initialName).toBeTruthy();

		await ensureSecondPantry(page);
		await switchToPantry(page, E2E_SECOND_PANTRY);
		await switchToPantry(page, initialName!);

		await expect(page).toHaveURL(/\/inkop/);
	});
});

test.describe('Household switcher (mobile)', () => {
	test.setTimeout(90_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('switches pantry from mobile header', async ({ page }) => {
		await page.goto('/planer');
		await dismissOnboardingModalIfOpen(page);

		await ensureSecondPantry(page);
		await switchToPantry(page, E2E_SECOND_PANTRY);

		await expect(page).toHaveURL(/\/planer/);
		await expect(
			page.getByRole('button', { name: new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`) })
		).toBeVisible();
	});
});
