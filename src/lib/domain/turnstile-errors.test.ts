import { describe, expect, it } from 'vitest';
import {
	getTurnstileLoadErrorMessageKey,
	TURNSTILE_INVALID_DOMAIN_CODE
} from './turnstile-errors';

describe('getTurnstileLoadErrorMessageKey', () => {
	it('maps invalid domain error to domain-specific copy', () => {
		expect(getTurnstileLoadErrorMessageKey(TURNSTILE_INVALID_DOMAIN_CODE)).toBe(
			'auth.register.captchaDomainError'
		);
	});

	it('maps missing site key to not-configured copy', () => {
		expect(getTurnstileLoadErrorMessageKey('missing-key')).toBe('captcha.notConfigured');
	});

	it('falls back to generic load error', () => {
		expect(getTurnstileLoadErrorMessageKey('300030')).toBe('auth.register.captchaLoadError');
		expect(getTurnstileLoadErrorMessageKey(undefined)).toBe('auth.register.captchaLoadError');
	});
});
