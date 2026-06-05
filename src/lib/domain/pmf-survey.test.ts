import { describe, expect, it } from 'vitest';
import { computeNpsSummary, isPmfSurveyTrigger, isPmfWouldMiss } from './pmf-survey';

describe('pmf-survey domain', () => {
	it('validates trigger and would-miss enums', () => {
		expect(isPmfSurveyTrigger('post_onboarding')).toBe(true);
		expect(isPmfSurveyTrigger('periodic')).toBe(true);
		expect(isPmfSurveyTrigger('other')).toBe(false);
		expect(isPmfWouldMiss('yes')).toBe(true);
		expect(isPmfWouldMiss('maybe')).toBe(false);
	});

	it('computes NPS from scores', () => {
		expect(computeNpsSummary([10, 9, 7, 6, 0])).toEqual({
			nps: 0,
			promoters: 2,
			passives: 1,
			detractors: 2
		});
		expect(computeNpsSummary([])).toEqual({
			nps: null,
			promoters: 0,
			passives: 0,
			detractors: 0
		});
	});
});
