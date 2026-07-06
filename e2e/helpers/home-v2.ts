import { expect, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen } from './auth';
import { mockReceiptParse } from './mock-api';
import { uploadReceiptPdf } from './receipt';

const FIXTURE_PDF = 'tests/fixtures/receipts/synthetic-ica-01.pdf';

export async function addShoppingListItemViaApi(page: Page, name: string): Promise<void> {
	const response = await page.request.post('/inkop?/add', {
		form: { name, quantity: '', unit: '' },
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		}
	});

	expect(response.ok()).toBe(true);
}

/**
 * Dismiss the receipt-import success moment if it is (or becomes) visible.
 * Escape works regardless of household member count — the secondary CTA
 * testid moves behind the "Fler val" toggle for single-member households.
 * Dismissing also clears the session pending flag so the moment does not
 * reopen on the next navigation and block later clicks.
 */
export async function dismissReceiptImportSuccessIfOpen(page: Page): Promise<void> {
	const success = page.getByTestId('receipt-import-success');
	const appeared = await success
		.waitFor({ state: 'visible', timeout: 5_000 })
		.then(() => true)
		.catch(() => false);
	if (!appeared) return;
	await page.keyboard.press('Escape');
	await expect(success).not.toBeVisible({ timeout: 5_000 });
}

/**
 * A receipt import can complete the activation milestone, which queues the
 * "Bra start!" celebration modal (ActivationCelebration) for the next
 * navigation. Its dismiss paths all navigate away, so clear the pending flag
 * instead to keep multi-import flows on the page they expect.
 */
async function clearCelebrationPending(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (let i = localStorage.length - 1; i >= 0; i -= 1) {
			const key = localStorage.key(i);
			if (key && key.includes('celebration-pending')) {
				localStorage.removeItem(key);
			}
		}
	});
}

async function dismissActivationCelebrationIfOpen(page: Page): Promise<void> {
	const celebration = page.locator('.celebration-panel');
	if (await celebration.isVisible().catch(() => false)) {
		await page.keyboard.press('Escape');
		await celebration.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
	}
}

export async function importReceiptLines(
	page: Page,
	lines: Array<{ name: string; quantity?: string; unit?: string; location?: string }>
): Promise<void> {
	await mockReceiptParse(page, { body: { lines } });
	await page.goto('/scan/kvitto');
	await dismissOnboardingModalIfOpen(page);
	await clearCelebrationPending(page);
	await dismissActivationCelebrationIfOpen(page);
	await dismissReceiptImportSuccessIfOpen(page);
	await uploadReceiptPdf(page, FIXTURE_PDF);
	/* Quick confirm re-checks every line first — the recently-added dedupe chip may have
	   unchecked lines matching pantry items created by earlier specs in the same run. */
	await expect(page.getByTestId('receipt-quick-confirm')).toBeVisible({ timeout: 15_000 });
	await page.getByTestId('receipt-quick-confirm').click();
	await dismissReceiptImportSuccessIfOpen(page);
	await clearCelebrationPending(page);
	await dismissActivationCelebrationIfOpen(page);
}

export function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

/**
 * Delete every active inventory item in `location` whose name contains `nameFragment`.
 *
 * Used to seed a replenishment suggestion: `detectReplenishmentSuggestions`
 * excludes any product whose normalized name is currently in inventory
 * (`listInventoryNormalizedKeys` reads ALL inventory rows). A receipt import
 * both records purchase lines AND creates inventory items, so the imported
 * product can never surface as a suggestion while its item exists. Hard-deleting
 * the item removes it from `listInventoryNormalizedKeys` (a real DELETE, not a
 * soft finish) while the receipt purchase lines persist — so the product
 * becomes replenishment-eligible.
 */
export async function deleteInventoryItemsByName(
	page: Page,
	nameFragment: string,
	location: 'fridge' | 'freezer' | 'cupboard' = 'fridge'
): Promise<number> {
	const items = await fetchActiveItems(page, location);
	const ids = items.filter((item) => item.name.includes(nameFragment)).map((item) => item.id);
	await bulkDeleteByIds(page, location, ids);
	return ids.length;
}

/**
 * Best-effort seed of a replenishment suggestion for the current household.
 *
 * Imports the product as three lines in a SINGLE receipt batch — three recorded
 * purchase lines would clear the "recurring" line-count threshold
 * (RECEIPT_PATTERN_MIN_LINES = 3) — then deletes the inventory items the import
 * created so `detectReplenishmentSuggestions` no longer excludes the key
 * (`listInventoryNormalizedKeys` reads ALL inventory rows).
 *
 * This is BEST-EFFORT, not guaranteed: the replenishment signal derives only from
 * recorded receipt purchase lines, and the receipt-confirm UI is the only E2E
 * path that records them. That path is racy across DB states — the first import
 * on a fresh household runs the activation flow and may not record all three
 * lines, and the confirm's recently-added dedupe can deselect matching lines.
 * The caller must therefore verify the for-you kind and skip (not fail) when the
 * seed did not take. See the TODO in the replenishment spec. Returns the product
 * name so the caller can assert on it when the seed does surface.
 */
export async function seedReplenishmentSuggestion(page: Page, name: string): Promise<string> {
	await importReceiptLines(page, [
		{ name, quantity: '1', unit: '', location: 'fridge' },
		{ name, quantity: '1', unit: '', location: 'fridge' },
		{ name, quantity: '1', unit: '', location: 'fridge' }
	]);
	await deleteInventoryItemsByName(page, name, 'fridge');
	return name;
}

const STORAGE_LOCATIONS = ['fridge', 'freezer', 'cupboard'] as const;
const EXPIRING_SOON_DAYS = 7;

async function fetchActiveItems(
	page: Page,
	location: (typeof STORAGE_LOCATIONS)[number]
): Promise<Array<{ id: string; name: string; expiresOn: string | null }>> {
	const response = await page.request.get(
		`/api/inventory/data?section=active&location=${location}&limit=200`
	);
	expect(response.ok()).toBe(true);
	const payload = (await response.json()) as {
		items: Array<{ id: string; name: string; expiresOn: string | null }>;
	};
	return payload.items;
}

async function bulkDeleteByIds(
	page: Page,
	location: (typeof STORAGE_LOCATIONS)[number],
	ids: string[]
): Promise<void> {
	if (ids.length === 0) return;
	const body = new URLSearchParams();
	for (const id of ids) body.append('itemIds', id);
	const del = await page.request.post(`/inventory/${location}?/bulkDeleteItems`, {
		data: body.toString(),
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true',
			'content-type': 'application/x-www-form-urlencoded'
		}
	});
	expect(del.ok()).toBe(true);
}

/**
 * Delete every active item across all storage locations whose expiry falls
 * inside the "expiring soon" window (today .. today + 7d). The home for-you slot
 * follows precedence recipe → replenishment → expiring → shopReady and the pulse
 * card surfaces the same expiring items, so specs that assert on the
 * replenishment, shop-ready, or moment states must first remove expiring rows
 * left behind by earlier specs on the shared admin household — otherwise an
 * expiring card wins the slot and the assertion can never run.
 */
export async function clearExpiringSoonItems(page: Page): Promise<number> {
	const today = new Date();
	const horizon = new Date(today);
	horizon.setDate(horizon.getDate() + EXPIRING_SOON_DAYS);
	const todayIso = today.toISOString().slice(0, 10);
	const horizonIso = horizon.toISOString().slice(0, 10);

	let removed = 0;
	for (const location of STORAGE_LOCATIONS) {
		const items = await fetchActiveItems(page, location);
		const expiringIds = items
			.filter((item) => item.expiresOn && item.expiresOn >= todayIso && item.expiresOn <= horizonIso)
			.map((item) => item.id);
		await bulkDeleteByIds(page, location, expiringIds);
		removed += expiringIds.length;
	}
	return removed;
}

/**
 * Seed a household shopping cadence: two receipt import batches count as two
 * shopping trips, the minimum `deriveHouseholdShoppingCadence` needs to return
 * a non-null cadence. Products go to the cupboard without expiry so they never
 * surface as expiring rows, and use distinct single-line names so neither
 * becomes a recurring replenishment suggestion (that needs >= 2 imports of the
 * SAME product or >= 3 lines).
 */
export async function seedShoppingCadence(page: Page, label = 'Cadence'): Promise<void> {
	const stamp = Date.now();
	await importReceiptLines(page, [
		{ name: `E2E ${label} A ${stamp}`, quantity: '1', unit: '', location: 'cupboard' }
	]);
	await importReceiptLines(page, [
		{ name: `E2E ${label} B ${stamp}`, quantity: '1', unit: '', location: 'cupboard' }
	]);
}

/**
 * Remove every unchecked item from the shopping list via the /inkop clearList
 * action. Used to drop shoppingListCount to 0 so the shopReady for-you card
 * (which needs a non-empty list) cannot surface — required to make the calm
 * "moment" card deterministic.
 */
export async function clearShoppingList(page: Page): Promise<void> {
	const response = await page.request.post('/inkop?/clearList', {
		form: {},
		headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
	});
	expect(response.ok()).toBe(true);
}

export async function openHomeV2Briefing(page: Page): Promise<void> {
	await page.goto('/hem');
	await dismissOnboardingModalIfOpen(page);
	await dismissPageHintIfOpen(page);
	await expect(page.getByTestId('home-v2-page')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('home-v2-briefing')).toBeVisible();
}

/**
 * Dismiss any replenishment for-you card currently surfaced on /hem, up to
 * `maxDismissals` times. The for-you slot precedence is
 * recipe → replenishment → expiring → shopReady, so a lingering replenishment
 * suggestion (from receipt lines left by earlier specs on the shared admin
 * household) would win the slot ahead of shopReady. Dismissing adds the key to
 * the household's dismissed set permanently and re-renders, letting the next
 * candidate take the slot. Assumes the caller has already cleared expiring items.
 */
export async function dismissReplenishmentCards(page: Page, maxDismissals = 6): Promise<void> {
	const forYou = page.getByTestId('home-v2-for-you');
	for (let i = 0; i < maxDismissals; i += 1) {
		const visible = await forYou
			.waitFor({ state: 'visible', timeout: 5_000 })
			.then(() => true)
			.catch(() => false);
		if (!visible) return;
		if ((await forYou.getAttribute('data-for-you-kind')) !== 'replenishment') return;

		await forYou.getByTestId('home-v2-for-you-secondary').click();
		/* onDismissReplenishment calls invalidateAll — wait for the card to either
		   disappear or re-render with the next candidate before checking again. */
		await page.waitForTimeout(1_000);
	}
}
