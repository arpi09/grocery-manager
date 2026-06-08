import { expect, type Page } from '@playwright/test';

/** Ensures at least one active fridge row for mobile inventory E2E (CI shards may start empty). */
export async function ensureFridgeInventoryItem(page: Page, name?: string): Promise<string> {
	const itemName = name ?? `E2E Fridge ${Date.now()}`;
	await page.goto('/item/new?location=fridge&from=/inventory/fridge');
	await page.locator('input[name="name"]').fill(itemName);
	const submit = page.locator('form').getByRole('button', { name: /L.gg till vara|Add item/i });
	await Promise.all([
		page.waitForURL(/\/inventory\/fridge/, { timeout: 15_000 }),
		submit.click()
	]);
	return itemName;
}

/** Simulates a horizontal swipe on a row (works with pointer handlers in compact inventory rows). */
export async function swipeRowHorizontal(
	page: Page,
	rowLocator: ReturnType<Page['locator']>,
	direction: 'left' | 'right'
) {
	const nameLink = rowLocator.locator('.name');
	const target = (await nameLink.count()) > 0 ? nameLink.first() : rowLocator;
	const box = await target.boundingBox();
	if (!box) {
		throw new Error('Swipe target has no bounding box');
	}

	const centerY = box.y + box.height / 2;
	const startX = direction === 'right' ? box.x + 4 : box.x + box.width - 4;
	const endX = direction === 'right' ? box.x + box.width - 4 : box.x + 4;

	await page.mouse.move(startX, centerY);
	await page.mouse.down();
	await page.mouse.move(endX, centerY, { steps: 12 });
	await page.mouse.up();
}
