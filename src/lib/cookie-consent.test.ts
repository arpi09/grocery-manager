import { describe, expect, it } from 'vitest';
import {
	hasAnalyticsConsent,
	hasConsentChoice,
	parseCookieConsent
} from '$lib/cookie-consent';
import { resolveLandingVariant } from '$lib/marketing/landing-variants';

describe('cookie consent', () => {
	it('parses stored choices', () => {
		expect(parseCookieConsent('all')).toBe('all');
		expect(parseCookieConsent('essential')).toBe('essential');
		expect(parseCookieConsent(' ALL ')).toBe('all');
		expect(parseCookieConsent(undefined)).toBeNull();
		expect(parseCookieConsent('marketing')).toBeNull();
	});

	it('tracks whether a choice was made', () => {
		expect(hasConsentChoice('all')).toBe(true);
		expect(hasConsentChoice('essential')).toBe(true);
		expect(hasConsentChoice(null)).toBe(false);
	});

	it('gates analytics on accept all only', () => {
		expect(hasAnalyticsConsent('all')).toBe(true);
		expect(hasAnalyticsConsent('essential')).toBe(false);
		expect(hasAnalyticsConsent(null)).toBe(false);
	});
});

describe('resolveLandingVariant with consent', () => {
	it('ignores variant cookie when allowVariantCookie is false', () => {
		expect(
			resolveLandingVariant({
				cookieVariant: 'b',
				envVariant: 'a',
				allowVariantCookie: false
			})
		).toBe('a');
	});

	it('still prefers query when cookies are disallowed', () => {
		expect(
			resolveLandingVariant({
				queryHero: 'b',
				cookieVariant: 'a',
				allowVariantCookie: false
			})
		).toBe('b');
	});
});
