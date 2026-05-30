import { describe, expect, it } from 'vitest';
import { isChurnReason, isProductFeedbackSource } from './product-feedback';

describe('product-feedback domain', () => {
	it('validates churn reasons', () => {
		expect(isChurnReason('forgot_habit')).toBe(true);
		expect(isChurnReason('invalid')).toBe(false);
		expect(isChurnReason(null)).toBe(false);
	});

	it('validates feedback sources', () => {
		expect(isProductFeedbackSource('settings')).toBe(true);
		expect(isProductFeedbackSource('post_onboarding')).toBe(true);
		expect(isProductFeedbackSource('survey')).toBe(false);
	});
});
