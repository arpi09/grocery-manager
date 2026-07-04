import { describe, expect, it } from 'vitest';
import { isNavActive, NAV_ITEMS, PANTRY_SHELF_PATH } from './nav-config';

describe('nav-config pantry entry', () => {
	const pantryItem = NAV_ITEMS.find((item) => item.badge === 'stale')!;

	it('points pantry nav to the shelf path', () => {
		expect(pantryItem.href).toBe(PANTRY_SHELF_PATH);
	});

	it('marks shelf and table fallback routes active', () => {
		expect(isNavActive('/inventory', pantryItem)).toBe(true);
		expect(isNavActive('/inventory/fridge', pantryItem)).toBe(true);
		expect(isNavActive('/inventory/freezer?filter=expiring', pantryItem)).toBe(true);
		expect(isNavActive('/inkop', pantryItem)).toBe(false);
	});
});
