import { describe, expect, it } from 'vitest';
import {
	buildInventoryListMetaParts,
	formatCompactExpiryDate,
	formatInventoryListExpiryPart,
	formatInventoryListQuantity,
	formatInventoryQuantityAmount,
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

	it('trims meaningless decimals from quantities', () => {
		expect(formatInventoryQuantityAmount('1.00')).toBe('1');
		expect(formatInventoryQuantityAmount('32.00')).toBe('32');
		expect(formatInventoryQuantityAmount('1.50')).toBe('1.5');
		expect(formatInventoryQuantityAmount('0.25')).toBe('0.25');
	});

	it('keeps non-numeric quantities untouched', () => {
		expect(formatInventoryQuantityAmount('en burk')).toBe('en burk');
	});

	it('formats "1.00 st" as "1 st kvar"', () => {
		expect(formatInventoryListQuantity({ quantity: '1.00', unit: 'st' }, 'sv')).toBe('1 st kvar');
	});

	it('keeps meaningful decimals like "1.5 l"', () => {
		expect(formatInventoryListQuantity({ quantity: '1.50', unit: 'l' }, 'sv')).toBe('1.5 l kvar');
	});

	it('formats compact expiry dates without year for the current year', () => {
		const today = new Date(2026, 5, 15);
		expect(formatCompactExpiryDate('2026-06-24', 'sv', today)).not.toContain('2026');
		expect(formatCompactExpiryDate('2026-06-24', 'sv', today)).toMatch(/24 juni/);
		expect(formatCompactExpiryDate('2026-06-24', 'en', today)).toMatch(/24 Jun/);
	});

	it('keeps the year in compact expiry dates for other years', () => {
		const today = new Date(2026, 5, 15);
		expect(formatCompactExpiryDate('2027-01-02', 'sv', today)).toContain('2027');
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
