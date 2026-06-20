import { test, expect, type Page } from '@playwright/test';

import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	loginAsAdmin
} from './helpers/auth';

const legacyShoppingGridPath = '/inkop?sort=added&dir=desc&pageSize=25';

function uncheckedShoppingRow(page: Page, itemName: string) {
	return page
		.locator('#shopping-list-panel [data-testid^="shopping-grid-row-"]')
		.filter({ hasText: itemName });
}

async function dismissShoppingInkopOverlays(page: Page) {
	await dismissPostOnboardingShareIfOpen(page);
	await dismissPageHintIfOpen(page);
}

async function postShoppingAction(
	page: Page,
	action: string,
	form: Record<string, string> = {},
	refererPath = legacyShoppingGridPath
) {
	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
	const response = await page.request.post(`${baseURL}/inkop?/${action}`, {
		form,
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true',
			origin: baseURL,
			referer: `${baseURL}${refererPath}`
		},
		timeout: 30_000
	});
	expect(response.ok()).toBeTruthy();
	const result = (await response.json()) as { type?: string; data?: unknown };
	expect(result.type).toBe('success');
	return result;
}

async function openLegacyShoppingGrid(page: Page) {
	test.skip(
		process.env.SHOPPING_UX_V2_ENABLED === 'true',
		'Legacy checklist grid lives in Shopping V2 drawer when SHOPPING_UX_V2_ENABLED=true'
	);

	await page.goto(legacyShoppingGridPath, { waitUntil: 'domcontentloaded' });
	await dismissShoppingInkopOverlays(page);
	await expect(page.locator('#shopping-list-panel')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByTestId('shopping-list-add-form')).toBeVisible({ timeout: 15_000 });
}

async function seedLegacyShoppingItemViaApi(page: Page, itemName: string) {
	await postShoppingAction(page, 'add', { name: itemName });
}

async function addLegacyShoppingItem(page: Page, itemName: string) {
	await seedLegacyShoppingItemViaApi(page, itemName);

	await page.goto(`/inkop?sort=added&dir=desc&pageSize=25&q=${encodeURIComponent(itemName)}`, {
		waitUntil: 'domcontentloaded'
	});
	await dismissShoppingInkopOverlays(page);
	await expect(page.locator('#shopping-list-panel')).toBeVisible({ timeout: 15_000 });
	await expect(uncheckedShoppingRow(page, itemName)).toBeVisible({ timeout: 30_000 });
}

test.describe('Shopping list', () => {
	test.setTimeout(60_000);

	test('smart fill adds fixture items when E2E_MOCK_AI is enabled', async ({ page }) => {
		await loginAsAdmin(page);

		await page.goto(legacyShoppingGridPath);

		await dismissOnboardingModalIfOpen(page);

		await dismissPageHintIfOpen(page);

		await postShoppingAction(page, 'clearChecked');
		await postShoppingAction(page, 'fillFromPantry', {
			preferences: '',
			householdSize: '2'
		});

		await page.goto(
			`/inkop?sort=added&dir=desc&pageSize=25&q=${encodeURIComponent('E2E Smartfill')}`,
			{ waitUntil: 'domcontentloaded' }
		);
		await dismissShoppingInkopOverlays(page);

		const panel = page.locator('#shopping-list-panel');

		await expect(panel.getByText(/E2E Smartfill Mj/)).toBeVisible({ timeout: 20_000 });

		await expect(panel.getByText('E2E Smartfill Banan')).toBeVisible();

		await expect(panel).toBeInViewport({ timeout: 10_000 });
	});

	test('add line and check off item @deploy-critical', async ({ page }) => {
		test.setTimeout(90_000);

		const itemName = `E2E Inkop ${Date.now()}`;

		await openLegacyShoppingGrid(page);
		await addLegacyShoppingItem(page, itemName);

		const row = uncheckedShoppingRow(page, itemName);
		const rowId = await row.getAttribute('data-testid');
		expect(rowId).toMatch(/^shopping-grid-row-/);
		const id = rowId!.slice('shopping-grid-row-'.length);

		const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
		const toggleResponse = await page.request.post(`${baseURL}/inkop?/toggle`, {
			form: { id },
			headers: {
				accept: 'application/json',
				'x-sveltekit-action': 'true',
				origin: baseURL,
				referer: `${baseURL}/inkop`
			},
			timeout: 30_000
		});
		expect(toggleResponse.ok()).toBeTruthy();

		await page.goto(`/inkop?sort=added&dir=desc&pageSize=25&q=${encodeURIComponent(itemName)}`, {
			waitUntil: 'domcontentloaded'
		});
		await dismissShoppingInkopOverlays(page);

		const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
		if (await pantrySheet.isVisible().catch(() => false)) {
			await pantrySheet
				.getByRole('button', { name: /Nej, bara lista|No, list only/i })
				.click({ force: true });
		}

		await expect(uncheckedShoppingRow(page, itemName)).toHaveCount(0, { timeout: 30_000 });
	});

	test('grid filter finds added item @deploy-critical', async ({ page }) => {
		test.skip(
			process.env.SHOPPING_UX_V2_ENABLED === 'true',
			'Legacy checklist grid lives in Shopping V2 drawer when SHOPPING_UX_V2_ENABLED=true'
		);
		test.setTimeout(90_000);

		const itemName = `E2E Grid Filter ${Date.now()}`;

		await seedLegacyShoppingItemViaApi(page, itemName);
		await page.goto(`/inkop?sort=added&dir=desc&pageSize=25&q=${encodeURIComponent(itemName)}`, {
			waitUntil: 'domcontentloaded'
		});
		await dismissShoppingInkopOverlays(page);
		await expect(page.locator('#shopping-list-panel')).toBeVisible({ timeout: 30_000 });
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible({
			timeout: 15_000
		});
		await expect(uncheckedShoppingRow(page, itemName)).toBeVisible({ timeout: 30_000 });
	});

	test('check off opens pantry bridge sheet and can add to pantry', async ({ page }) => {
		test.setTimeout(60_000);

		const itemName = `E2E Pantry Bridge ${Date.now()}`;

		await openLegacyShoppingGrid(page);
		await postShoppingAction(page, 'savePantryMode', { shoppingToPantryMode: 'ask' });
		await addLegacyShoppingItem(page, itemName);

		const row = uncheckedShoppingRow(page, itemName);

		await row.locator('form[action="?/toggle"] input[type=checkbox]').click();

		await dismissPageHintIfOpen(page);

		const sheet = page.getByTestId('shopping-to-pantry-sheet');

		await expect(sheet).toBeVisible({ timeout: 20_000 });

		await sheet.getByRole('button', { name: /Ja,|Yes,/i }).click();

		await expect(
			page.locator('.toast-message').filter({ hasText: /skafferiet|pantry/i })
		).toBeVisible({ timeout: 15_000 });
	});
});
