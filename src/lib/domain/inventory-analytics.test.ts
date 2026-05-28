import { describe, it, expect } from 'vitest';
import { buildLocationBars } from './inventory-analytics';

describe('buildLocationBars', () => {
	it('returns zero percent bars when inventory is empty', () => {
		const bars = buildLocationBars(
			[
				{ location: 'fridge', count: 0 },
				{ location: 'freezer', count: 0 },
				{ location: 'cupboard', count: 0 }
			],
			0
		);

		expect(bars.every((bar) => bar.percent === 0)).toBe(true);
	});

	it('computes rounded percentages from counts', () => {
		const bars = buildLocationBars(
			[
				{ location: 'fridge', count: 2 },
				{ location: 'freezer', count: 1 },
				{ location: 'cupboard', count: 0 }
			],
			3
		);

		expect(bars).toEqual([
			{ location: 'fridge', count: 2, percent: 67 },
			{ location: 'freezer', count: 1, percent: 33 },
			{ location: 'cupboard', count: 0, percent: 0 }
		]);
	});
});
