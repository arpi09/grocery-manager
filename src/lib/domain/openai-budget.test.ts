import { describe, expect, it } from 'vitest';
import {
	estimateOpenAiSpendUsd,
	openAiBudgetStatus,
	parseOpenAiMonthlyBudgetUsd
} from './openai-budget';

describe('parseOpenAiMonthlyBudgetUsd', () => {
	it('returns null when unset or invalid', () => {
		expect(parseOpenAiMonthlyBudgetUsd(undefined)).toBeNull();
		expect(parseOpenAiMonthlyBudgetUsd('')).toBeNull();
		expect(parseOpenAiMonthlyBudgetUsd('0')).toBeNull();
		expect(parseOpenAiMonthlyBudgetUsd('nope')).toBeNull();
	});

	it('parses positive numbers', () => {
		expect(parseOpenAiMonthlyBudgetUsd('25')).toBe(25);
		expect(parseOpenAiMonthlyBudgetUsd(' 12.5 ')).toBe(12.5);
	});
});

describe('estimateOpenAiSpendUsd', () => {
	it('sums kind counts with per-kind estimates', () => {
		expect(
			estimateOpenAiSpendUsd({
				ai_scan: 10,
				receipt_pdf: 5,
				smart_fill: 20,
				admin_insights: 0,
				weekly_plan: 0
			})
		).toBeCloseTo(10 * 0.015 + 5 * 0.02 + 20 * 0.008, 5);
	});
});

describe('openAiBudgetStatus', () => {
	it('flags over and near budget', () => {
		expect(openAiBudgetStatus(10, 10)).toEqual({ overBudget: true, nearBudget: false });
		expect(openAiBudgetStatus(8, 10)).toEqual({ overBudget: false, nearBudget: true });
		expect(openAiBudgetStatus(5, 10)).toEqual({ overBudget: false, nearBudget: false });
		expect(openAiBudgetStatus(100, null)).toEqual({ overBudget: false, nearBudget: false });
	});
});
