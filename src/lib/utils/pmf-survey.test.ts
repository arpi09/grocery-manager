import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isActivationComplete } from './onboarding';
import { shouldShowPmfSurvey } from './pmf-survey';
import { getPmfSurveyEligibleAt, markPmfSurveyEligible } from './pmf-survey-storage';

describe('shouldShowPmfSurvey', () => {
	const userId = 'user-pmf-1';
	const store = new Map<string, string>();

	beforeEach(() => {
		store.clear();
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: (key: string) => {
				store.delete(key);
			},
			clear: () => {
				store.clear();
			}
		});

		store.set(`home-pantry-onboarding-version:${userId}`, '3');
		store.set(`home-pantry-onboarding-dismissed:${userId}`, '1');
		store.set(`home-pantry-onboarding-activation-receipt-done:${userId}`, '1');
		store.set(`home-pantry-onboarding-post-onboarding-survey-dismissed:${userId}`, '1');
	});

	it('returns false before eligible time', () => {
		markPmfSurveyEligible(userId);
		expect(shouldShowPmfSurvey(userId, '/hem')).toBe(false);
	});

	it('returns true on calm paths after eligible time', () => {
		expect(isActivationComplete(userId)).toBe(true);
		store.set(`home-pantry-pmf-survey-eligible-at:${userId}`, String(Date.now() - 1_000));
		expect(getPmfSurveyEligibleAt(userId)).toBeLessThan(Date.now());
		expect(shouldShowPmfSurvey(userId, '/hem')).toBe(true);
	});

	it('defers when post-onboarding survey is pending', () => {
		store.delete(`home-pantry-onboarding-post-onboarding-survey-dismissed:${userId}`);
		store.set(`home-pantry-onboarding-post-onboarding-survey-pending:${userId}`, '1');
		store.set(`home-pantry-pmf-survey-eligible-at:${userId}`, String(Date.now() - 1_000));
		expect(shouldShowPmfSurvey(userId, '/hem')).toBe(false);
	});
});
