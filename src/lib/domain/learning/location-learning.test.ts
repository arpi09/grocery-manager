import { describe, expect, it } from 'vitest';
import {
	isHouseholdLocationRuleReady,
	modelVersionForPredictionSource,
	resolveLearnedLocation
} from './location-learning';

describe('location-learning', () => {
	it('requires two samples before household rule is ready', () => {
		expect(isHouseholdLocationRuleReady(0)).toBe(false);
		expect(isHouseholdLocationRuleReady(1)).toBe(false);
		expect(isHouseholdLocationRuleReady(2)).toBe(true);
	});

	it('maps prediction source to model version', () => {
		expect(modelVersionForPredictionSource('household_rule')).toBe('household-v1');
		expect(modelVersionForPredictionSource('heuristic')).toBe('heuristic-v1');
	});

	it('resolves learned location from feedback type', () => {
		expect(resolveLearnedLocation('accepted', 'fridge', 'cupboard')).toBe('fridge');
		expect(resolveLearnedLocation('corrected', 'fridge', 'cupboard')).toBe('cupboard');
		expect(resolveLearnedLocation('rejected', 'fridge', 'cupboard')).toBeNull();
	});
});
