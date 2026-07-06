import { describe, expect, it } from 'vitest';
import { getWeeklyWasteTip, isoWeekNumber, WASTE_TIPS } from './waste-tips';

describe('isoWeekNumber', () => {
	it('computes ISO-8601 week numbers', () => {
		// 2026-01-01 is a Thursday → ISO week 1.
		expect(isoWeekNumber(new Date('2026-01-01'))).toBe(1);
		expect(isoWeekNumber(new Date('2026-07-06'))).toBe(28);
	});
});

describe('getWeeklyWasteTip', () => {
	it('is stable within a week and rotates across weeks', () => {
		const tips = [
			{ tip: 'a', detail: 'da' },
			{ tip: 'b', detail: 'db' }
		];
		const w1 = getWeeklyWasteTip(new Date('2026-01-01'), tips); // week 1 → index 0
		const w2 = getWeeklyWasteTip(new Date('2026-01-08'), tips); // week 2 → index 1
		expect(w1.tip).toBe('a');
		expect(w2.tip).toBe('b');
		// Same week, different day → same tip.
		expect(getWeeklyWasteTip(new Date('2026-01-02'), tips).tip).toBe('a');
	});

	it('always returns a real tip from the default set', () => {
		const tip = getWeeklyWasteTip(new Date('2026-07-06'));
		expect(WASTE_TIPS).toContainEqual(tip);
		expect(tip.tip.length).toBeGreaterThan(0);
		expect(tip.detail.length).toBeGreaterThan(0);
	});
});
