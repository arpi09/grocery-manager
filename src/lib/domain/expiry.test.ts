import { describe, expect, it } from 'vitest';
import { daysUntilExpiry, formatDaysLeftSv } from './expiry';

describe('expiry helpers', () => {
	const today = new Date(2026, 4, 28);

	it('counts whole days until expiry', () => {
		expect(daysUntilExpiry('2026-05-30', today)).toBe(2);
		expect(daysUntilExpiry('2026-05-28', today)).toBe(0);
	});

	it('formats Swedish day labels', () => {
		expect(formatDaysLeftSv(0)).toBe('Går ut idag');
		expect(formatDaysLeftSv(1)).toBe('1 dag kvar');
		expect(formatDaysLeftSv(3)).toBe('3 dagar kvar');
	});
});
