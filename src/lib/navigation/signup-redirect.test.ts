import { describe, expect, it } from 'vitest';

import {
	HOUSEHOLD_SETTINGS_REDIRECT,
	isHouseholdSettingsRedirect,
	resolvePostSignupAppPath,
	resolvePostVerifyLanding,
	safeSignupRedirect
} from './signup-redirect';

describe('signup-redirect', () => {
	it('accepts safe relative redirects including hash', () => {
		expect(safeSignupRedirect(HOUSEHOLD_SETTINGS_REDIRECT)).toBe(HOUSEHOLD_SETTINGS_REDIRECT);
		expect(safeSignupRedirect('/inkop')).toBe('/inkop');
		expect(safeSignupRedirect('//evil.com')).toBeNull();
		expect(safeSignupRedirect('https://evil.com')).toBeNull();
	});

	it('detects household invite intent from lista signup', () => {
		expect(isHouseholdSettingsRedirect(HOUSEHOLD_SETTINGS_REDIRECT)).toBe(true);
		expect(isHouseholdSettingsRedirect('/settings')).toBe(true);
		expect(isHouseholdSettingsRedirect('/inkop')).toBe(false);
	});

	it('lands lista signups on inköp after email verify', () => {
		expect(resolvePostVerifyLanding(HOUSEHOLD_SETTINGS_REDIRECT)).toBe('/inkop?welcome=1');
		expect(resolvePostVerifyLanding('/settings#household')).toBe('/inkop?welcome=1');
		expect(resolvePostVerifyLanding(null)).toBe('/inkop?welcome=1');
	});

	it('honours other safe post-verify redirects', () => {
		expect(resolvePostVerifyLanding('/invite/abc')).toBe('/invite/abc');
	});

	it('maps household intent to inköp for OAuth signup', () => {
		expect(resolvePostSignupAppPath(HOUSEHOLD_SETTINGS_REDIRECT)).toBe('/inkop');
		expect(resolvePostSignupAppPath('/invite/abc')).toBe('/invite/abc');
	});
});
