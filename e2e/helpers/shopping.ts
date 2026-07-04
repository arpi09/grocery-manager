import { expect, type Page } from '@playwright/test';
import * as devalue from 'devalue';
import { dismissPageHintIfOpen } from './auth';

function baseUrl(): string {
	return process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
}

/**
 * Remove every unchecked shopping-list item via the /inkop remove action, so a spec
 * starts from an empty shared list. Specs share the admin household DB — leftovers from
 * other specs otherwise push new items behind the "+N till" pill truncation and steal
 * the shop-mode focus slot.
 */
export async function clearShoppingList(page: Page) {
	const response = await page.request
		.get(`${baseUrl()}/inkop/__data.json`)
		.catch(() => null);
	if (!response?.ok()) return;
	const payload = (await response.json().catch(() => null)) as {
		nodes?: Array<{ type?: string; data?: unknown[] }>;
	} | null;
	const ids = new Set<string>();
	for (const node of payload?.nodes ?? []) {
		if (node?.type !== 'data' || !Array.isArray(node.data)) continue;
		let value: unknown;
		try {
			value = devalue.unflatten(node.data);
		} catch {
			continue;
		}
		collectShoppingItemIds(value, ids);
	}
	for (const id of ids) {
		await page.request
			.post(`${baseUrl()}/inkop?/remove`, {
				form: { id },
				headers: {
					accept: 'application/json',
					'x-sveltekit-action': 'true',
					origin: baseUrl(),
					referer: `${baseUrl()}/inkop`
				}
			})
			.catch(() => null);
	}
}

/** Quick-add is hydration- and page-hint-sensitive: retry the open click until the form is live. */
export async function addItemViaQuickAdd(page: Page, itemName: string) {
	await expect(async () => {
		await dismissPageHintIfOpen(page);
		const quickAdd = page.getByTestId('shopping-v2-quick-add');
		if (!(await quickAdd.isVisible().catch(() => false))) {
			/* Empty list renders "Lägg till första varan"; populated list renders "Lägg till vara". */
			await page
				.getByRole('button', { name: /Lägg till (första varan|vara)|Add (first item|item)/i })
				.first()
				.click();
		}
		await expect(quickAdd.locator('#shopping-v2-name')).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 20_000 });
	await page.getByTestId('shopping-v2-quick-add').locator('#shopping-v2-name').fill(itemName);
	await page
		.getByTestId('shopping-v2-quick-add')
		.getByRole('button', { name: /Lägg till|Add/i })
		.click();
	await expect(page.getByTestId('shopping-v2-summary-pills')).toContainText(itemName, {
		timeout: 15_000
	});
}

/** The pantry sheet animates in after a checkoff — wait for it briefly, then dismiss and wait out the scrim. */
export async function dismissPantrySheetIfOpen(page: Page, waitMs = 3_000) {
	const pantrySheet = page.getByTestId('shopping-to-pantry-sheet');
	const appeared = await pantrySheet
		.waitFor({ state: 'visible', timeout: waitMs })
		.then(() => true)
		.catch(() => false);
	if (appeared) {
		await pantrySheet.getByRole('button', { name: /Nej, bara lista|No, list only/i }).click();
		await pantrySheet.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
	}
}

/** "Visa som checklista" can be clicked pre-hydration — retry until the drawer opens. */
export async function openChecklistDrawer(page: Page) {
	const drawer = page.getByTestId('shopping-v2-legacy-drawer');
	await expect(async () => {
		await dismissPageHintIfOpen(page);
		await page.getByRole('button', { name: /Visa som checklista|Show as checklist/i }).click();
		await expect(drawer).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 20_000 });
	return drawer;
}

function collectShoppingItemIds(value: unknown, ids: Set<string>, depth = 0): void {
	if (!value || typeof value !== 'object' || depth > 4) return;
	if (Array.isArray(value)) {
		for (const entry of value) collectShoppingItemIds(entry, ids, depth + 1);
		return;
	}
	const record = value as Record<string, unknown>;
	if (Array.isArray(record.items)) {
		for (const item of record.items) {
			if (!item || typeof item !== 'object') continue;
			const candidate = item as Record<string, unknown>;
			/* Shape-match ShoppingListItem — suggestion lists lack `checked`. */
			if (
				typeof candidate.id === 'string' &&
				typeof candidate.name === 'string' &&
				typeof candidate.checked === 'boolean'
			) {
				ids.add(candidate.id);
			}
		}
	}
	for (const entry of Object.values(record)) collectShoppingItemIds(entry, ids, depth + 1);
}
