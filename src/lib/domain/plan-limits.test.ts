import { describe, expect, it } from 'vitest';
import { buildPlanLimitsSnapshot, evaluatePlanLimit, getTierLimit } from './plan-limits';

describe('plan-limits', () => {
	it('evaluates free tier at limit when usage meets cap', () => {
		expect(evaluatePlanLimit('maxInventoryItems', 150, 'free').atLimit).toBe(true);
		expect(evaluatePlanLimit('maxInventoryItems', 149, 'free').atLimit).toBe(false);
	});

	it('never blocks Pro tier limits', () => {
		expect(evaluatePlanLimit('aiScansPerMonth', 999, 'pro').atLimit).toBe(false);
		expect(getTierLimit('aiScansPerMonth', 'pro')).toBeNull();
	});

	it('builds blocked keys from snapshot', () => {
		const snapshot = buildPlanLimitsSnapshot('free', {
			maxInventoryItems: 150,
			maxHouseholdMembers: 1,
			aiScansPerMonth: 20,
			receiptPdfParsesPerMonth: 0,
			smartFillPerWeek: 0
		});
		expect(snapshot.blockedKeys).toEqual(['maxInventoryItems', 'aiScansPerMonth']);
	});

});
