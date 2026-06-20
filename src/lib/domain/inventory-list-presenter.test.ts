import { describe, expect, it } from 'vitest';
import {
	buildInventoryListMetaParts,
	formatInventoryListExpiryPart,
	formatInventoryListQuantity,
	isInventoryExpiryEstimated
} from './inventory-list-presenter';

function expiringSoonIso(daysFromNow: number): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

describe('inventory-list-presenter', () => {
	it('formats quantity with remaining label when stock is positive', () => {
		expect(
			formatInventoryListQuantity({ quantity: '2', unit: 'st' }, 'sv')
		).toContain('2 st');
	});

	it('uses relative expiry for items within seven days', () => {
		const expiry = formatInventoryListExpiryPart({ expiresOn: expiringSoonIso(3) }, 'sv');
		expect(expiry).toMatch(/3 dag/);
	});

	it('uses best-before label for distant expiry dates', () => {
		const expiry = formatInventoryListExpiryPart({ expiresOn: expiringSoonIso(30) }, 'sv');
		expect(expiry).toMatch(/Bäst före/);
	});

	it('builds meta parts without expiry when date is missing', () => {
		expect(
			buildInventoryListMetaParts({ quantity: '1', unit: null, expiresOn: null }, 'sv')
		).toEqual({
			quantity: '1 kvar',
			expiry: null
		});
	});

	it('flags non-user expiry sources as estimated', () => {
		expect(isInventoryExpiryEstimated('user_set')).toBe(false);
		expect(isInventoryExpiryEstimated('ai_inferred')).toBe(true);
		expect(isInventoryExpiryEstimated(null)).toBe(false);
	});
});
