import { describe, expect, it } from 'vitest';
import { computeMetricBarWidths } from './metric-bar';

describe('computeMetricBarWidths', () => {
	it('splits values proportionally', () => {
		const result = computeMetricBarWidths([
			{ key: 'a', value: 2, color: 'red' },
			{ key: 'b', value: 1, color: 'blue' },
			{ key: 'c', value: 1, color: 'green' }
		]);

		expect(result).toEqual([
			{ key: 'a', value: 2, color: 'red', widthPercent: 50 },
			{ key: 'b', value: 1, color: 'blue', widthPercent: 25 },
			{ key: 'c', value: 1, color: 'green', widthPercent: 25 }
		]);
	});

	it('returns zero widths when total is zero', () => {
		const result = computeMetricBarWidths([
			{ key: 'a', value: 0, color: 'red' },
			{ key: 'b', value: -3, color: 'blue' }
		]);

		expect(result.every((segment) => segment.widthPercent === 0)).toBe(true);
		expect(result[1]?.value).toBe(0);
	});

	it('ignores negative values in totals', () => {
		const result = computeMetricBarWidths([
			{ key: 'a', value: 3, color: 'red' },
			{ key: 'b', value: -5, color: 'blue' }
		]);

		expect(result[0]?.widthPercent).toBe(100);
		expect(result[1]?.widthPercent).toBe(0);
	});
});
