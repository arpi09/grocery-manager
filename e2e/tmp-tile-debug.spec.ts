import { test } from '@playwright/test';

import { dismissOnboardingModalIfOpen, dismissPageHintIfOpen, loginAsAdmin } from './helpers/auth';
import { createFridgeItemViaApi } from './helpers/inventory';

test('tmp: debug pantry tile focus and Enter', async ({ page }) => {
	const itemName = `E2E TileDebug ${Date.now()}`;
	await loginAsAdmin(page);
	await createFridgeItemViaApi(page, itemName);
	await page.goto('/inventory');
	await dismissOnboardingModalIfOpen(page);
	await dismissPageHintIfOpen(page);

	const tile = page.getByTestId('pantry-v2-product-tile').filter({ hasText: itemName }).first();
	await tile.waitFor({ state: 'visible' });
	console.log(
		'TILE_HTML',
		await tile.evaluate((el) => el.outerHTML.slice(0, 300))
	);
	await tile.focus();
	console.log(
		'ACTIVE_AFTER_FOCUS',
		await page.evaluate(() => {
			const a = document.activeElement;
			return a ? `${a.tagName} testid=${a.getAttribute('data-testid')} class=${a.className}` : 'null';
		})
	);
	await page.waitForTimeout(1500);
	console.log(
		'ACTIVE_AFTER_WAIT',
		await page.evaluate(() => {
			const a = document.activeElement;
			return a ? `${a.tagName} testid=${a.getAttribute('data-testid')} class=${a.className}` : 'null';
		})
	);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(2000);
	console.log('URL_AFTER_ENTER', page.url());
});
