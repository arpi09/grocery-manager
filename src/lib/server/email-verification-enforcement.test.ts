import { describe, expect, it } from 'vitest';
import {
	isEmailVerificationPath,
	isPathAllowedForUnverifiedUser,
	isUserEmailVerified,
	shouldRedirectUnverifiedUser
} from './email-verification-enforcement';

describe('email-verification-enforcement', () => {
	it('treats verified users as verified', () => {
		expect(isUserEmailVerified({ emailVerifiedAt: new Date() })).toBe(true);
	});

	it('treats unverified users as not verified', () => {
		expect(isUserEmailVerified({ emailVerifiedAt: null })).toBe(false);
	});

	it('allows verify-email routes for unverified users', () => {
		expect(isPathAllowedForUnverifiedUser('/verify-email')).toBe(true);
		expect(isPathAllowedForUnverifiedUser('/verify-email/abc')).toBe(true);
		expect(isEmailVerificationPath('/verify-email/token')).toBe(true);
	});

	it('allows logout, login, and marketing pages for unverified users', () => {
		expect(isPathAllowedForUnverifiedUser('/logout')).toBe(true);
		expect(isPathAllowedForUnverifiedUser('/login')).toBe(true);
		expect(isPathAllowedForUnverifiedUser('/')).toBe(true);
		expect(isPathAllowedForUnverifiedUser('/funktioner')).toBe(true);
		expect(isPathAllowedForUnverifiedUser('/privacy')).toBe(true);
		expect(shouldRedirectUnverifiedUser({ emailVerifiedAt: null }, '/faq')).toBe(false);
	});

	it('redirects unverified users away from app routes', () => {
		expect(shouldRedirectUnverifiedUser({ emailVerifiedAt: null }, '/hem')).toBe(true);
		expect(shouldRedirectUnverifiedUser({ emailVerifiedAt: new Date() }, '/hem')).toBe(false);
		expect(shouldRedirectUnverifiedUser({ emailVerifiedAt: null }, '/verify-email')).toBe(false);
	});
});
