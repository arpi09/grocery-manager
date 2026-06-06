import { describe, expect, it } from 'vitest';
import {
	buildSavingsReport,
	estimateItemValueSek,
	estimateItemWeightKg
} from '$lib/domain/savings-estimate';

describe('savings-estimate', () => {
	it('uses category heuristics for known products', () => {
		expect(estimateItemValueSek('Kycklingfilé')).toBe(89);
		expect(estimateItemWeightKg('Tomat')).toBe(0.4);
	});

	it('builds savings report from consumption events', () => {
		const report = buildSavingsReport([
			{ productName: 'Mjölk', eventType: 'consumed' },
			{ productName: 'Yoghurt', eventType: 'expired' }
		]);

		expect(report.hasData).toBe(true);
		expect(report.consumedCount).toBe(1);
		expect(report.wastedCount).toBe(1);
		expect(report.savedSek).toBeGreaterThan(0);
		expect(report.wastedSek).toBeGreaterThan(0);
	});
});
