import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ONBOARDING_VERSION,
	completeOnboarding,
	isOnboardingExcludedPath,
	resetOnboarding,
	shouldShowOnboarding
} from './onboarding';
import { APP_HOME_PATH } from '$lib/navigation/app-home';

describe('onboarding helpers', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows onboarding when nothing is stored', () => {
		expect(shouldShowOnboarding()).toBe(true);
	});

	it('hides onboarding after completion for the current version', () => {
		completeOnboarding();
		expect(shouldShowOnboarding()).toBe(false);
	});

	it('shows onboarding again when version changes', () => {
		completeOnboarding();
		storage['home-pantry-onboarding-version'] = String(ONBOARDING_VERSION - 1);
		expect(shouldShowOnboarding()).toBe(true);
	});

	it('reset clears stored onboarding state', () => {
		completeOnboarding();
		resetOnboarding();
		expect(shouldShowOnboarding()).toBe(true);
	});

	it('excludes admin and auth routes', () => {
		expect(isOnboardingExcludedPath('/admin')).toBe(true);
		expect(isOnboardingExcludedPath('/admin/users')).toBe(true);
		expect(isOnboardingExcludedPath('/login')).toBe(true);
		expect(isOnboardingExcludedPath('/register')).toBe(true);
		expect(isOnboardingExcludedPath('/')).toBe(true);
		expect(isOnboardingExcludedPath('/funktioner')).toBe(true);
		expect(isOnboardingExcludedPath(APP_HOME_PATH)).toBe(false);
		expect(isOnboardingExcludedPath('/scan')).toBe(false);
	});
});
