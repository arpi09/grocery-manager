import { test, expect, type Page } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	loginAsAdmin
} from './helpers/auth';

/** Empty list renders "Lägg till första varan"; non-empty renders "Lägg till vara". */
const addItemButton = (page: Page) =>
	page.getByRole('button', { name: /Lägg till (första )?vara|Add (first )?item/i }).first();

/** Retry the click until the quick-add form mounts — absorbs clicks lost to hydration. */
async function openQuickAdd(page: Page, itemName: string) {
	await expect(async () => {
		await addItemButton(page).click();
		await expect(page.getByTestId('shopping-v2-quick-add')).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 20_000 });
	// The summary pills cap at 3 item names ("+N till"), so the new item's name may be
	// hidden — treat any pills change as confirmation the add landed.
	const pills = page.getByTestId('shopping-v2-summary-pills');
	const pillsBefore = (await pills.textContent().catch(() => '')) ?? '';
	await page.getByTestId('shopping-v2-quick-add').locator('#shopping-v2-name').fill(itemName);
	await page
		.getByTestId('shopping-v2-quick-add')
		.getByRole('button', { name: /Lägg till|Add/i })
		.click();
	await expect(async () => {
		const now = (await pills.textContent().catch(() => '')) ?? '';
		expect(now.includes(itemName) || (now.length > 0 && now !== pillsBefore)).toBe(true);
	}).toPass({ timeout: 15_000 });
}

async function dismissPantrySheetIfOpen(page: Page) {
	const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
	if (await pantrySheet.isVisible().catch(() => false)) {
		await pantrySheet
			.getByRole('button', { name: /Nej, bara lista|No, list only/i })
			.click({ timeout: 2_000 })
			.catch(() => {});
	}
}

/** Retry the drawer trigger until the drawer mounts — absorbs clicks lost to hydration. */
async function openLegacyDrawer(page: Page) {
	const drawer = page.getByTestId('shopping-v2-legacy-drawer');
	await expect(async () => {
		await dismissPantrySheetIfOpen(page);
		await page
			.getByRole('button', { name: /Visa som checklista|Show as checklist/i })
			.click({ timeout: 2_000 });
		await expect(drawer).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 20_000 });
	return drawer;
}

/**
 * Picks through the trip until it completes. The shared admin list can hold leftover
 * items from other specs, so the focus item is not necessarily ours — assert that our
 * item shows up in focus at some point instead of requiring it first. The pantry sheet
 * and celebration modals can pop between picks, so dismiss before every click.
 */
async function pickThroughTrip(page: Page, itemName: string) {
	const pickCta = page.getByTestId('shopping-v2-pick-cta');
	const tripComplete = page.getByTestId('shopping-v2-trip-complete');
	let sawItem = false;
	for (let i = 0; i < 60; i += 1) {
		await dismissPantrySheetIfOpen(page);
		if (await tripComplete.isVisible().catch(() => false)) break;
		if (!(await pickCta.isVisible().catch(() => false))) {
			await page.waitForTimeout(250);
			continue;
		}
		const focusText = await page
			.getByTestId('shopping-v2-focus-item')
			.textContent()
			.catch(() => '');
		if (focusText?.includes(itemName)) {
			sawItem = true;
		}
		await pickCta.click({ timeout: 2_000 }).catch(() => {});
	}
	await dismissPantrySheetIfOpen(page);
	expect(sawItem, `expected "${itemName}" to appear as trip focus item`).toBe(true);
	await expect(tripComplete).toBeVisible({ timeout: 20_000 });
}

test.describe('Shopping UX v2', () => {
	test.setTimeout(90_000);

	test('plan to shop trip flow @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E V2 ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-page')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
		await expect(page.locator('#shopping-list-panel')).not.toBeVisible();

		await page.getByTestId('shopping-v2-mode-plan').click();
		await openQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();

		await pickThroughTrip(page, itemName);

		await expect(async () => {
			await dismissPantrySheetIfOpen(page);
			await page
				.getByRole('button', { name: /Planera|Plan|Back to planning/i })
				.first()
				.click({ timeout: 2_000 });
			await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 2_000 });
		}).toPass({ timeout: 20_000 });
	});

	test('checklist drawer grid filter and back to plan @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await openQuickAdd(page, itemName);

		const drawer = await openLegacyDrawer(page);
		await expect(page.getByTestId('shopping-checklist-grid-table')).toBeVisible();
		await expect(drawer.getByText(itemName)).toBeVisible();

		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(async () => {
			await drawer.getByTestId('data-grid-filter-button').click();
			await expect(filterSheet).toBeVisible({ timeout: 2_000 });
		}).toPass({ timeout: 15_000 });
		await filterSheet.locator('#data-grid-filter-search').fill(itemName);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();

		const row = drawer.locator(`[data-testid^="shopping-grid-row-"]`).filter({ hasText: itemName });
		await expect(row).toBeVisible();
		await expect(row.getByTestId('product-avatar')).toBeVisible();
		// The drawer grid's table cells can overlap the checkoff button — bypass the hit-test.
		await row.getByTestId(/^shopping-grid-checkoff-/).click({ force: true });

		await dismissPantrySheetIfOpen(page);

		await drawer.getByRole('button', { name: /Tillbaka till Plan|Back to Plan/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible();
	});

	test('checklist drawer accessible from shop mode @deploy-critical', async ({ page }) => {
		test.skip(process.env.SHOPPING_UX_V2_ENABLED !== 'true', 'Requires SHOPPING_UX_V2_ENABLED=true');

		const itemName = `E2E Shop Grid ${Date.now()}`;

		await loginAsAdmin(page);
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);
		await dismissPostOnboardingShareIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await openQuickAdd(page, itemName);

		await page.getByTestId('shopping-v2-start-shop').click();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();

		const drawer = await openLegacyDrawer(page);
		await expect(drawer.getByText(itemName)).toBeVisible();

		await drawer.getByRole('button', { name: /Tillbaka till Handla|Back to Shop/i }).click();
		await expect(drawer).not.toBeVisible();
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible();
	});
});
