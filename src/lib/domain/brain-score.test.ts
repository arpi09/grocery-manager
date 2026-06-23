import { describe, expect, it } from 'vitest';
import { computeBrainScore, getSnapshot } from './brain-score';

describe('computeBrainScore', () => {
	it('returns 0 for empty household', () => {
		expect(computeBrainScore({ ruleCount: 0, feedbackCount: 0, receiptLineCount: 0 })).toBe(0);
	});

	it('caps at 100', () => {
		expect(
			computeBrainScore({ ruleCount: 50, feedbackCount: 50, receiptLineCount: 100 })
		).toBeLessThanOrEqual(100);
	});

	it('weights rules and receipt lines', () => {
		expect(
			computeBrainScore({ ruleCount: 2, feedbackCount: 0, receiptLineCount: 5 })
		).toBeGreaterThan(0);
	});
});

describe('getSnapshot', () => {
	it('returns label key based on tier', () => {
		const snap = getSnapshot({ ruleCount: 5, feedbackCount: 3, receiptLineCount: 10 });
		expect(snap.labelKey).toMatch(/^brain\.score/);
		expect(snap.score).toBe(computeBrainScore({ ruleCount: 5, feedbackCount: 3, receiptLineCount: 10 }));
	});
});
