import { describe, expect, it } from 'vitest';
import {
	applyNavFeatureFlags,
	isNavActive,
	NAV_ITEMS,
	PANTRY_SHELF_PATH
} from './nav-config';

describe('nav-config pantry v2 flags', () => {
	const pantryItem = NAV_ITEMS.find((item) => item.badge === 'stale')!;

	it('keeps legacy fridge href when flag is off', () => {
		const items = applyNavFeatureFlags(NAV_ITEMS, { pantryUxV2Enabled: false });
		expect(items.find((item) => item.badge === 'stale')?.href).toBe('/inventory/fridge');
	});

	it('points pantry nav to shelf path when flag is on', () => {
		const items = applyNavFeatureFlags(NAV_ITEMS, { pantryUxV2Enabled: true });
		expect(items.find((item) => item.badge === 'stale')?.href).toBe(PANTRY_SHELF_PATH);
	});

	it('marks shelf and table fallback routes active when flag is on', () => {
		const shelfItem = { ...pantryItem, href: PANTRY_SHELF_PATH };
		expect(isNavActive('/inventory', shelfItem)).toBe(true);
		expect(isNavActive('/inventory/fridge', shelfItem)).toBe(true);
		expect(isNavActive('/inventory/freezer?filter=expiring', shelfItem)).toBe(true);
		expect(isNavActive('/inkop', shelfItem)).toBe(false);
	});

	it('marks only legacy fridge prefix active when flag is off', () => {
		expect(isNavActive('/inventory/fridge', pantryItem)).toBe(true);
		expect(isNavActive('/inventory', pantryItem)).toBe(false);
	});
});
