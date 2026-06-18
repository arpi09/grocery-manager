import { expect, type Page } from '@playwright/test';

export interface CreateFridgeItemOptions {
	expiresOn?: string;
	location?: 'fridge' | 'freezer' | 'cupboard';
	returnTo?: string;
}

/** Creates a fridge item via SvelteKit action (faster than full form navigation). */
export async function createFridgeItemViaApi(
	page: Page,
	name: string,
	options: CreateFridgeItemOptions = {}
): Promise<void> {
	const location = options.location ?? 'fridge';
	const returnTo = options.returnTo ?? `/inventory/${location}`;

	const response = await page.request.post('/item/new?/create', {
		form: {
			name,
			location,
			quantity: '1',
			unit: '',
			expiresOn: options.expiresOn ?? '',
			notes: '',
			returnTo
		},
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		maxRedirects: 0
	});

	expect([200, 302, 303]).toContain(response.status());
}

/** Ensures at least one active fridge row for mobile inventory E2E (CI shards may start empty). */
export async function ensureFridgeInventoryItem(page: Page, name?: string): Promise<string> {
	const itemName = name ?? `E2E Fridge ${Date.now()}`;
	await createFridgeItemViaApi(page, itemName);
	return itemName;
}

/** Simulates a horizontal swipe on a row using PointerEvents (mouse API is unreliable in CI). */
export async function swipeRowHorizontal(
	page: Page,
	rowLocator: ReturnType<Page['locator']>,
	direction: 'left' | 'right'
) {
	const handle = rowLocator.getByTestId('inventory-swipe-handle');
	const target = (await handle.count()) > 0 ? handle.first() : rowLocator;
	const box = await target.boundingBox();
	if (!box) {
		throw new Error('Swipe target has no bounding box');
	}

	const centerY = box.y + box.height / 2;
	const startX = direction === 'right' ? box.x + 8 : box.x + box.width - 8;
	const endX = direction === 'right' ? box.x + box.width - 8 : box.x + 8;

	await target.evaluate(
		(el, coords) => {
			const pointerId = 42;
			const mk = (type: string, clientX: number) =>
				new PointerEvent(type, {
					pointerId,
					pointerType: 'touch',
					clientX,
					clientY: coords.centerY,
					bubbles: true,
					cancelable: true,
					buttons: type === 'pointerup' ? 0 : 1
				});

			el.dispatchEvent(mk('pointerdown', coords.startX));
			const steps = 12;
			for (let i = 1; i <= steps; i++) {
				const x = coords.startX + (coords.endX - coords.startX) * (i / steps);
				el.dispatchEvent(mk('pointermove', x));
			}
			el.dispatchEvent(mk('pointerup', coords.endX));
		},
		{ startX, endX, centerY }
	);

	await expect
		.poll(async () => (await rowLocator.locator('.swipe-dragging').count()) === 0, {
			timeout: 2_000,
			intervals: [50, 100, 150]
		})
		.toBe(true);
}
