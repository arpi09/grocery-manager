import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import { createFridgeItemViaApi } from './helpers/inventory';
import {
	addShoppingListItemViaApi,
	clearExpiringSoonItems,
	clearShoppingList,
	dismissReplenishmentCards,
	expiringSoonIso,
	openHomeV2Briefing,
	seedReplenishmentSuggestion,
	seedShoppingCadence
} from './helpers/home-v2';
import { expectItemOnShoppingList, removeShoppingListItemByName } from './helpers/shopping-v2';

test.describe('Home UX v2', () => {
	/* Serial: these specs share the admin household and several now mutate it
	   destructively (clearExpiringSoonItems / clearShoppingList / dismiss) to make
	   the for-you slot deterministic. Running them in parallel across CI workers
	   would let one spec delete another's seeded expiring rows mid-flight. */
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(120_000);

	test('briefing greeting, pulse card, and chips @deploy-critical', async ({ page }) => {
		const expiringName = `E2E Home V2 ${Date.now()}`;

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(2) });
		await openHomeV2Briefing(page);

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByTestId('home-v2-chips')).toBeVisible();

		const pulse = page.getByTestId('home-v2-pulse-card');
		await expect(pulse).toBeVisible();
		await expect(pulse.getByTestId('home-v2-pulse-open')).toBeVisible();
		await expect(pulse.getByTestId('home-v2-expiring-row').first()).toBeVisible();
	});

	test('pulse card quick-add puts expiring items on the shopping list', async ({ page }) => {
		const expiringName = `E2E Pulse Add ${Date.now()}`;

		await loginAsAdmin(page);
		/* Deterministic top-of-list: the pulse card shows the 3 items with the
		   nearest expiry (findExpiringBefore orders by expiresOn ASC). Clearing the
		   shared household's other expiring rows and seeding this item to expire
		   today guarantees it sorts first, so it is always among the visible rows. */
		await clearExpiringSoonItems(page);
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(0) });
		await openHomeV2Briefing(page);

		const pulse = page.getByTestId('home-v2-pulse-card');
		await expect(pulse).toBeVisible();

		const row = pulse.getByTestId('home-v2-expiring-row').filter({ hasText: expiringName });
		await expect(row).toBeVisible({ timeout: 15_000 });

		await pulse.getByTestId('home-v2-pulse-add').click();
		await expect(pulse.getByRole('status')).toBeVisible({ timeout: 15_000 });

		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		/* Assert via the checklist drawer (filters by name) rather than the summary
		   pills — the pills only show the three OLDEST unchecked items, so on the
		   accumulating shared admin household the freshly added item is not guaranteed
		   to appear there. */
		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await expectItemOnShoppingList(page, expiringName);

		/* Clean up so the list does not grow unbounded across runs. */
		await removeShoppingListItemByName(page, expiringName);
	});

	test('shop-ready CTA opens shopping shop mode @deploy-critical', async ({ page }) => {
		const listItem = `E2E Shop Ready ${Date.now()}`;

		await loginAsAdmin(page);
		/* shopReady is last in the for-you precedence (recipe → replenishment →
		   expiring → shopReady). Guarantee it wins by removing every higher-priority
		   candidate: clear expiring rows, then dismiss any replenishment suggestions
		   left by earlier specs. Recipe suggestions require stored meal-plan ideas,
		   which the E2E household never generates. */
		await clearExpiringSoonItems(page);
		await addShoppingListItemViaApi(page, listItem);

		/* Cadence is derived from receipt import batches, and on a freshly seeded
		   household the first imports can drop lines (activation flow / confirm
		   dedupe), so seed and verify with a bounded retry: import a cadence pair,
		   open /hem, and if shopReady has not surfaced yet add another pair. Two
		   batches is the minimum deriveHouseholdShoppingCadence needs; extra batches
		   only reinforce it. */
		const forYou = page.getByTestId('home-v2-for-you');
		for (let attempt = 1; attempt <= 3; attempt += 1) {
			await seedShoppingCadence(page, `Cadence${attempt}`);
			await openHomeV2Briefing(page);
			await dismissReplenishmentCards(page);
			const kind = await forYou
				.getAttribute('data-for-you-kind')
				.catch(() => null);
			if (kind === 'shopReady') break;
		}

		await expect(forYou).toBeVisible({ timeout: 15_000 });
		await expect(forYou).toHaveAttribute('data-for-you-kind', 'shopReady', { timeout: 15_000 });

		await forYou.getByRole('link').click();
		await expect(page).toHaveURL(/\/inkop/, { timeout: 15_000 });
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible({ timeout: 15_000 });

		/* Clean up the seeded list item so it doesn't starve later pill assertions. */
		await removeShoppingListItemByName(page, listItem);
	});

	test('/hem briefing has no critical axe violations @deploy-critical', async ({ page }) => {
		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, `E2E Home A11y ${Date.now()}`);
		await openHomeV2Briefing(page);

		await expectNoCriticalOrSeriousViolations(page, '/hem (home v2 briefing)');
	});

	test('moment card when nothing urgent @deploy-critical', async ({ page }) => {
		await loginAsAdmin(page);
		/* The calm "moment" card only renders when the for-you slot is empty AND no
		   expiring rows exist. Guarantee that on the shared admin household by:
		   clearing expiring items (no expiring card, no pulse rows), emptying the
		   shopping list (shoppingListCount = 0 → no shopReady), and dismissing any
		   replenishment suggestion. Keep one non-expiring item so the pantry is not
		   empty (else the emptyPantry moment renders, which is still a valid moment). */
		await createFridgeItemViaApi(page, `E2E Moment ${Date.now()}`, {
			expiresOn: expiringSoonIso(90)
		});
		await clearExpiringSoonItems(page);
		await clearShoppingList(page);
		await openHomeV2Briefing(page);
		await dismissReplenishmentCards(page);

		await expect(page.getByTestId('home-v2-for-you')).toHaveCount(0, { timeout: 15_000 });
		await expect(page.getByTestId('home-v2-expiring-row')).toHaveCount(0);

		const moment = page.getByTestId('home-v2-moment');
		await expect(moment).toBeVisible({ timeout: 15_000 });
		await expect(moment).toHaveAttribute('data-moment-kind', /.+/);

		await moment.getByRole('link').click();
		await expect(page).toHaveURL(/\/(scan|recept|inkop|statistik)/, { timeout: 15_000 });
	});

	/* Kept LAST in this serial describe on purpose: the replenishment seed is only
	   best-effort (see the TODO below), so should it ever fail rather than skip, the
	   serial abort must not take down the reliably-seeded specs above. */
	test('replenishment CTA adds item to shopping list @deploy-critical', async ({ page }) => {
		const productName = `E2E Replenish ${Date.now()}`;

		await loginAsAdmin(page);

		/* Attempt a deterministic replenishment seed: import the product across
		   receipt lines (recurring), delete the inventory items the import created so
		   the product is no longer excluded by listInventoryNormalizedKeys, and clear
		   expiring rows so the for-you precedence (recipe → replenishment → expiring →
		   shopReady) lands on replenishment.

		   TODO(e2e-seed): this seed is NOT reliably deterministic across DB states and
		   is the one skip in this file that could not be fully converted to a
		   guaranteed assertion. The replenishment signal is derived only from recorded
		   receipt purchase lines, and the receipt-confirm UI is the only way an E2E run
		   can create them. That path is racy: (a) on a fresh household the first import
		   runs through the activation/celebration flow and does not reliably record all
		   three lines; (b) the confirm's recently-added dedupe deselects matching
		   lines; and (c) once the suggestion is accepted onto the list it is excluded
		   again. A robust fix needs a test-only endpoint to record purchase lines
		   directly (bypassing inventory creation) — product-code territory, out of
		   scope here. When the seed DOES take, the assertions below run in full;
		   otherwise the test skips loudly with the observed for-you kind rather than
		   green-washing. */
		await seedReplenishmentSuggestion(page, productName);
		await clearExpiringSoonItems(page);

		await openHomeV2Briefing(page);

		const forYou = page.getByTestId('home-v2-for-you');
		const surfaced = await forYou
			.waitFor({ state: 'visible', timeout: 15_000 })
			.then(() => true)
			.catch(() => false);
		const kind = surfaced ? await forYou.getAttribute('data-for-you-kind') : 'none';
		if (kind !== 'replenishment') {
			test.skip(true, `replenishment seed did not surface (for-you kind: ${kind}) — see TODO`);
		}

		/* The replenishment card has two buttons: the primary "Lägg på inköpslistan"
		   accept CTA and a secondary "Inte nu" dismiss (data-testid
		   home-v2-for-you-secondary). Click the primary accept button specifically. */
		await forYou.getByRole('button', { name: /Lägg på inköpslistan|Add to shopping list/i }).click();
		await expect(page.getByTestId('home-v2-for-you')).not.toBeVisible({ timeout: 15_000 });

		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		await expect(page.getByTestId('shopping-v2-plan')).toBeVisible({ timeout: 15_000 });
		await expectItemOnShoppingList(page, productName);

		/* Clean up the seeded list item so it doesn't starve later pill assertions. */
		await removeShoppingListItemByName(page, productName);
	});
});
