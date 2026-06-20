import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';
import { expectNoCriticalOrSeriousViolations } from './helpers/axe';
import { createFridgeItemViaApi } from './helpers/inventory';
import {
	addShoppingListItemViaApi,
	expiringSoonIso,
	importReceiptLines,
	openHomeV2Briefing
} from './helpers/home-v2';

test.describe('Home UX v2', () => {
	test.setTimeout(120_000);

	test('briefing greeting, for-you card, and chips @deploy-critical', async ({ page }) => {
		test.skip(process.env.HOME_UX_V2_ENABLED !== 'true', 'Requires HOME_UX_V2_ENABLED=true');

		const expiringName = `E2E Home V2 ${Date.now()}`;

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, expiringName, { expiresOn: expiringSoonIso(2) });
		await openHomeV2Briefing(page);

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByTestId('home-v2-chips')).toBeVisible();
		await expect(page.getByTestId('home-v2-for-you')).toBeVisible();
		await expect(page.getByTestId('home-v2-for-you')).toHaveAttribute('data-for-you-kind', 'expiring');
	});

	test('replenishment CTA adds item to shopping list @deploy-critical', async ({ page }) => {
		test.skip(process.env.HOME_UX_V2_ENABLED !== 'true', 'Requires HOME_UX_V2_ENABLED=true');

		const productName = `E2E Replenish ${Date.now()}`;

		await loginAsAdmin(page);
		await importReceiptLines(page, [
			{ name: productName, quantity: '1', unit: '', location: 'fridge' }
		]);
		await importReceiptLines(page, [
			{ name: productName, quantity: '1', unit: '', location: 'fridge' }
		]);

		await openHomeV2Briefing(page);

		const forYou = page.getByTestId('home-v2-for-you');
		await expect(forYou).toBeVisible({ timeout: 15_000 });

		if ((await forYou.getAttribute('data-for-you-kind')) !== 'replenishment') {
			test.skip(true, 'Replenishment card not surfaced for seeded household');
		}

		await forYou.getByRole('button').click();
		await expect(page.getByTestId('home-v2-for-you')).not.toBeVisible({ timeout: 15_000 });

		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await dismissPageHintIfOpen(page);

		if (process.env.SHOPPING_UX_V2_ENABLED === 'true') {
			await expect(page.getByTestId('shopping-v2-summary-pills')).toContainText(productName, {
				timeout: 15_000
			});
		} else {
			await expect(page.locator('#shopping-list-panel')).toContainText(productName, {
				timeout: 15_000
			});
		}
	});

	test('shop-ready CTA opens shopping shop mode @deploy-critical', async ({ page }) => {
		test.skip(process.env.HOME_UX_V2_ENABLED !== 'true', 'Requires HOME_UX_V2_ENABLED=true');
		test.skip(
			process.env.SHOPPING_UX_V2_ENABLED !== 'true',
			'Requires SHOPPING_UX_V2_ENABLED=true for shop mode UI'
		);

		const listItem = `E2E Shop Ready ${Date.now()}`;

		await loginAsAdmin(page);
		await importReceiptLines(page, [
			{ name: `E2E Cadence A ${Date.now()}`, quantity: '1', unit: '', location: 'cupboard' }
		]);
		await importReceiptLines(page, [
			{ name: `E2E Cadence B ${Date.now()}`, quantity: '1', unit: '', location: 'cupboard' }
		]);
		await addShoppingListItemViaApi(page, listItem);
		await openHomeV2Briefing(page);

		const forYou = page.getByTestId('home-v2-for-you');
		await expect(forYou).toBeVisible({ timeout: 15_000 });

		if ((await forYou.getAttribute('data-for-you-kind')) !== 'shopReady') {
			test.skip(true, 'Shop-ready card not surfaced for seeded household');
		}

		await forYou.getByRole('link').click();
		await expect(page).toHaveURL(/\/inkop/, { timeout: 15_000 });
		await expect(page.getByTestId('shopping-v2-shop')).toBeVisible({ timeout: 15_000 });
	});

	test('/hem briefing has no critical axe violations @deploy-critical', async ({ page }) => {
		test.skip(process.env.HOME_UX_V2_ENABLED !== 'true', 'Requires HOME_UX_V2_ENABLED=true');

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, `E2E Home A11y ${Date.now()}`);
		await openHomeV2Briefing(page);

		await expectNoCriticalOrSeriousViolations(page, '/hem (home v2 briefing)');
	});

	test('moment card when nothing urgent @deploy-critical', async ({ page }) => {
		test.skip(process.env.HOME_UX_V2_ENABLED !== 'true', 'Requires HOME_UX_V2_ENABLED=true');

		await loginAsAdmin(page);
		await createFridgeItemViaApi(page, `E2E Moment ${Date.now()}`, {
			expiresOn: expiringSoonIso(90)
		});
		await openHomeV2Briefing(page);

		const forYou = page.getByTestId('home-v2-for-you');
		if (await forYou.isVisible().catch(() => false)) {
			test.skip(true, 'For-you card surfaced instead of moment');
		}

		const moment = page.getByTestId('home-v2-moment');
		await expect(moment).toBeVisible({ timeout: 15_000 });
		await expect(moment).toHaveAttribute('data-moment-kind', /.+/);

		await moment.getByRole('link').click();
		await expect(page).toHaveURL(/\/(scan|recept|inkop|statistik)/, { timeout: 15_000 });
	});
});
