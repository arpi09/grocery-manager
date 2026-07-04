import { test, expect, type Page } from '@playwright/test';
import * as devalue from 'devalue';

import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	loginAsAdmin
} from './helpers/auth';
import { openChecklistDrawer } from './helpers/shopping-v2';

async function dismissShoppingInkopOverlays(page: Page) {
	await dismissOnboardingModalIfOpen(page);
	await dismissPostOnboardingShareIfOpen(page);
	await dismissPageHintIfOpen(page);
}

async function postShoppingAction(
	page: Page,
	action: string,
	form: Record<string, string> = {}
) {
	const currentUrl = page.url();
	const baseURL = currentUrl.startsWith('http')
		? new URL(currentUrl).origin
		: (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190');
	const requestForm = Object.keys(form).length > 0 ? form : { _e2e: '1' };
	const response = await page.request.post(`${baseURL}/inkop?/${action}`, {
		form: requestForm,
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true',
			origin: baseURL,
			referer: `${baseURL}/inkop`
		},
		timeout: 30_000
	});
	expect(response.ok()).toBeTruthy();
	const result = JSON.parse(await response.text()) as { type?: string; data?: string | unknown };
	if (typeof result.data === 'string') {
		result.data = devalue.parse(result.data);
	}
	expect(result.type).toBe('success');
	return result;
}

test.describe('Shopping list', () => {
	test.setTimeout(60_000);

	test('seeded items show in plan summary pills @deploy-critical', async ({ page }) => {
		test.setTimeout(90_000);

		const itemName = `E2E Inkop ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop', { waitUntil: 'domcontentloaded' });
		await dismissShoppingInkopOverlays(page);
		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 30_000 });

		await postShoppingAction(page, 'add', { name: itemName });

		await page.goto('/inkop', { waitUntil: 'domcontentloaded' });
		await dismissShoppingInkopOverlays(page);
		await expect(page.getByTestId('shopping-v2-summary-pills')).toContainText(itemName, {
			timeout: 30_000
		});
	});

	test('check off can add to pantry through bridge action', async ({ page }) => {
		test.setTimeout(60_000);

		const itemName = `E2E Pantry Bridge ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop', { waitUntil: 'domcontentloaded' });
		await dismissShoppingInkopOverlays(page);
		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 30_000 });

		await postShoppingAction(page, 'savePantryMode', { shoppingToPantryMode: 'ask' });
		await postShoppingAction(page, 'add', { name: itemName });

		await page.goto('/inkop', { waitUntil: 'domcontentloaded' });
		await dismissShoppingInkopOverlays(page);
		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 30_000 });

		await openChecklistDrawer(page);
		const drawer = page.getByTestId('shopping-v2-legacy-drawer');
		await drawer.getByTestId('data-grid-filter-button').click();
		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(filterSheet).toBeVisible();
		await filterSheet.getByRole('searchbox').fill(itemName);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
		await expect(filterSheet).not.toBeVisible();
		const row = drawer
			.locator('[data-testid^="shopping-grid-row-"]')
			.filter({ hasText: itemName });
		await expect(row).toBeVisible({ timeout: 30_000 });
		const rowId = await row.getAttribute('data-testid');
		expect(rowId).toMatch(/^shopping-grid-row-/);
		const id = rowId!.slice('shopping-grid-row-'.length);

		const toggleResult = await postShoppingAction(page, 'toggle', { id });
		const pantryBridge = (
			toggleResult.data as
				| {
						pantryBridge?: {
							item: { id: string };
							preview: {
								location: string;
								quantity: string;
								unit: string | null;
								mergeCandidate: { id: string } | null;
							};
						};
				  }
				| undefined
		)?.pantryBridge;
		expect(pantryBridge).toBeTruthy();

		const addToPantryResult = await postShoppingAction(page, 'addToPantry', {
			shoppingItemId: pantryBridge!.item.id,
			location: pantryBridge!.preview.location,
			quantity: pantryBridge!.preview.quantity,
			unit: pantryBridge!.preview.unit ?? '',
			merge: pantryBridge!.preview.mergeCandidate ? '1' : '0',
			shoppingToPantryMode: 'ask'
		});
		expect(
			(
				addToPantryResult.data as
					| { pantryAdded?: { message?: string; location?: string } }
					| undefined
			)?.pantryAdded
		).toMatchObject({
			location: pantryBridge!.preview.location
		});
	});
});
