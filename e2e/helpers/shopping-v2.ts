import { expect, type Page } from '@playwright/test';

/**
 * Open the plan-view quick-add form and add an item.
 *
 * The opener label depends on list state: empty list renders the empty-state
 * CTA ("Lägg till första varan"), a non-empty list renders the summary CTA
 * ("Lägg till vara"). The click is retried via toPass to absorb hydration
 * races on slow CI runners (a click before Svelte attaches handlers is lost).
 */
export async function addItemViaQuickAdd(page: Page, name: string): Promise<void> {
	const quickAdd = page.getByTestId('shopping-v2-quick-add');
	await expect(async () => {
		if (!(await quickAdd.isVisible().catch(() => false))) {
			await page
				.getByRole('button', { name: /Lägg till (första )?vara|Add (first )?item/i })
				.first()
				.click({ timeout: 2_000 });
		}
		await expect(quickAdd).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 30_000 });

	await quickAdd.locator('#shopping-v2-name').fill(name);
	await quickAdd.getByRole('button', { name: /Lägg till|Add/i }).click();
	/* On success the quick-add form closes. The summary pills only show the
	   three oldest items, so they cannot be used to assert the new item. */
	await expect(quickAdd).not.toBeVisible({ timeout: 15_000 });
}

/**
 * Assert an item is on the shopping list by finding its row in the checklist
 * drawer, filtering by name to be independent of pagination and of items left
 * behind by parallel tests. Closes the drawer again before returning.
 */
export async function expectItemOnShoppingList(page: Page, name: string): Promise<void> {
	await openChecklistDrawer(page);
	const drawer = page.getByTestId('shopping-v2-legacy-drawer');
	const row = drawer.locator('[data-testid^="shopping-grid-row-"]').filter({ hasText: name });

	if (!(await row.isVisible().catch(() => false))) {
		await drawer.getByTestId('data-grid-filter-button').click();
		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(filterSheet).toBeVisible();
		await filterSheet.getByRole('searchbox').fill(name);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
		await expect(filterSheet).not.toBeVisible();
	}

	await expect(row).toBeVisible({ timeout: 15_000 });
	await page.keyboard.press('Escape');
	await expect(drawer).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Remove a shopping list item by name. Looks up the row id in the checklist
 * drawer, then removes via the form action. Tests that seed list items should
 * clean up with this — the summary pills only show the three oldest unchecked
 * items, so leftovers starve pill assertions in later specs on the shared
 * admin household.
 */
export async function removeShoppingListItemByName(page: Page, name: string): Promise<void> {
	await openChecklistDrawer(page);
	const drawer = page.getByTestId('shopping-v2-legacy-drawer');
	const row = drawer.locator('[data-testid^="shopping-grid-row-"]').filter({ hasText: name });

	if (!(await row.isVisible().catch(() => false))) {
		await drawer.getByTestId('data-grid-filter-button').click();
		const filterSheet = page.getByTestId('data-grid-filter-sheet');
		await expect(filterSheet).toBeVisible();
		await filterSheet.getByRole('searchbox').fill(name);
		await filterSheet.getByRole('button', { name: /Visa resultat|Show results/i }).click();
		await expect(filterSheet).not.toBeVisible();
	}

	await expect(row).toBeVisible({ timeout: 15_000 });
	const rowTestId = await row.getAttribute('data-testid');
	const id = rowTestId?.replace('shopping-grid-row-', '');
	expect(id, `row testid should carry the item id (got ${rowTestId})`).toBeTruthy();

	await page.keyboard.press('Escape');
	await expect(drawer).not.toBeVisible({ timeout: 5_000 });

	const response = await page.request.post('/inkop?/remove', {
		form: { id: id as string },
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		}
	});
	expect(response.ok()).toBe(true);
}

/**
 * In shop mode, pick items until the trip-complete card shows.
 *
 * The shared admin household can hold items from parallel tests or earlier
 * runs, so the trip is not guaranteed to contain exactly one item and the
 * focus item is the oldest unchecked item — not necessarily the one this
 * test added. Picks everything, dismissing the shopping-to-pantry sheet
 * when the household is in "ask" mode. When expectItemName is given, the
 * item must have been the focus item at some point during the trip.
 */
export async function pickAllUntilTripComplete(
	page: Page,
	options: { expectItemName?: string; maxPicks?: number } = {}
): Promise<void> {
	const { expectItemName, maxPicks = 40 } = options;
	const tripComplete = page.getByTestId('shopping-v2-trip-complete');
	const focusItem = page.getByTestId('shopping-v2-focus-item');
	const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
	let sawExpectedItem = false;

	for (let pick = 0; pick < maxPicks; pick += 1) {
		if (await tripComplete.isVisible().catch(() => false)) break;
		if (expectItemName && !sawExpectedItem) {
			const focusText = await focusItem.textContent().catch(() => null);
			if (focusText?.includes(expectItemName)) sawExpectedItem = true;
		}
		await page.getByTestId('shopping-v2-pick-cta').click({ timeout: 10_000 });
		const sheetShown = await pantrySheet
			.waitFor({ state: 'visible', timeout: 2_000 })
			.then(() => true)
			.catch(() => false);
		if (sheetShown) {
			await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();
			await expect(pantrySheet).not.toBeVisible({ timeout: 5_000 });
		}
	}

	await expect(tripComplete).toBeVisible({ timeout: 20_000 });
	if (expectItemName) expect(sawExpectedItem).toBe(true);
}

/**
 * Open the checklist drawer from plan or shop mode.
 * Retries the toggle click via toPass to absorb hydration races in CI.
 */
export async function openChecklistDrawer(page: Page): Promise<void> {
	const drawer = page.getByTestId('shopping-v2-legacy-drawer');
	await expect(async () => {
		if (!(await drawer.isVisible().catch(() => false))) {
			await page
				.getByRole('button', { name: /Visa som checklista|Show as checklist/i })
				.click({ timeout: 2_000 });
		}
		await expect(drawer).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 30_000 });
}
