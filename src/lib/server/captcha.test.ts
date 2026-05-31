import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv, mockPublicEnv, mockStaticPublicEnv } = vi.hoisted(() => ({
	mockEnv: {
		TURNSTILE_SECRET_KEY: undefined as string | undefined,
		TURNSTILE_SKIP: undefined as string | undefined,
		TURNSTILE_BYPASS: undefined as string | undefined,
		NODE_ENV: undefined as string | undefined
	},
	mockPublicEnv: {
		PUBLIC_TURNSTILE_SITE_KEY: undefined as string | undefined
	},
	mockStaticPublicEnv: {
		PUBLIC_TURNSTILE_SITE_KEY: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

vi.mock('$env/dynamic/public', () => ({
	env: mockPublicEnv
}));

vi.mock('$env/static/public', () => mockStaticPublicEnv);

import {
	CAPTCHA_FAILED_KEY,
	CAPTCHA_NOT_CONFIGURED_KEY,
	getTurnstileSecretKey,
	getTurnstileSiteKeyForClient,
	isTurnstileRequiredForRegistration,
	isTurnstileSkipEnabled,
	TURNSTILE_TEST_SECRET_KEY,
	verifyTurnstileToken,
	warnIfTurnstileMisconfigured
} from './captcha';

describe('getTurnstileSecretKey', () => {
	beforeEach(() => {
		mockEnv.TURNSTILE_SECRET_KEY = undefined;
	});

	it('reads TURNSTILE_SECRET_KEY from SvelteKit env', () => {
		mockEnv.TURNSTILE_SECRET_KEY = '  secret-key  ';
		expect(getTurnstileSecretKey()).toBe('secret-key');
	});

	it('returns null when no key is configured', () => {
		expect(getTurnstileSecretKey()).toBeNull();
	});
});

describe('getTurnstileSiteKeyForClient', () => {
	beforeEach(() => {
		mockEnv.TURNSTILE_SKIP = undefined;
		mockEnv.TURNSTILE_BYPASS = undefined;
		mockEnv.NODE_ENV = undefined;
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = undefined;
		mockStaticPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = undefined;
	});

	it('returns empty when bypass is enabled in non-production', () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = 'site-key';
		expect(getTurnstileSiteKeyForClient()).toBe('');
	});

	it('returns site key in production even when bypass is enabled', () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		mockEnv.NODE_ENV = 'production';
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = 'prod-site-key';
		expect(getTurnstileSiteKeyForClient()).toBe('prod-site-key');
	});

	it('returns trimmed site key from dynamic public env', () => {
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = '  0xabc  ';
		expect(getTurnstileSiteKeyForClient()).toBe('0xabc');
	});

	it('falls back to static public env when dynamic is missing', () => {
		mockStaticPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = 'static-key';
		expect(getTurnstileSiteKeyForClient()).toBe('static-key');
	});

	it('returns empty when site key is missing', () => {
		expect(getTurnstileSiteKeyForClient()).toBe('');
	});
});

describe('isTurnstileSkipEnabled', () => {
	beforeEach(() => {
		mockEnv.TURNSTILE_SKIP = undefined;
		mockEnv.TURNSTILE_BYPASS = undefined;
	});

	it('returns true when TURNSTILE_SKIP=true', () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		expect(isTurnstileSkipEnabled()).toBe(true);
	});

	it('returns true when TURNSTILE_BYPASS=true', () => {
		mockEnv.TURNSTILE_BYPASS = 'true';
		expect(isTurnstileSkipEnabled()).toBe(true);
	});

	it('returns false otherwise', () => {
		mockEnv.TURNSTILE_SKIP = 'false';
		mockEnv.TURNSTILE_BYPASS = 'false';
		expect(isTurnstileSkipEnabled()).toBe(false);
	});
});

describe('isTurnstileRequiredForRegistration', () => {
	beforeEach(() => {
		mockEnv.NODE_ENV = undefined;
		mockEnv.TURNSTILE_SKIP = undefined;
	});

	it('is false when bypass is enabled in non-production', () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		expect(isTurnstileRequiredForRegistration()).toBe(false);
	});

	it('is true when bypass is disabled in non-production', () => {
		mockEnv.TURNSTILE_SKIP = undefined;
		expect(isTurnstileRequiredForRegistration()).toBe(true);
	});

	it('is always true in production even when bypass is enabled', () => {
		mockEnv.NODE_ENV = 'production';
		mockEnv.TURNSTILE_SKIP = 'true';
		expect(isTurnstileRequiredForRegistration()).toBe(true);
	});
});

describe('warnIfTurnstileMisconfigured', () => {
	const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

	beforeEach(() => {
		mockEnv.NODE_ENV = 'production';
		mockEnv.TURNSTILE_SKIP = undefined;
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = undefined;
		mockStaticPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = undefined;
		errorSpy.mockClear();
	});

	afterAll(() => {
		errorSpy.mockRestore();
	});

	it('logs when production register load has no site key', () => {
		warnIfTurnstileMisconfigured('register load');

		expect(errorSpy).toHaveBeenCalledWith(
			'[turnstile] PUBLIC_TURNSTILE_SITE_KEY missing (register load) — widget hidden on /register'
		);
	});

	it('does not log when site key is configured', () => {
		mockPublicEnv.PUBLIC_TURNSTILE_SITE_KEY = '0xabc';
		warnIfTurnstileMisconfigured('register load');
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('does not log outside production', () => {
		mockEnv.NODE_ENV = 'test';
		warnIfTurnstileMisconfigured('register load');
		expect(errorSpy).not.toHaveBeenCalled();
	});
});

describe('verifyTurnstileToken', () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		mockEnv.TURNSTILE_SECRET_KEY = 'test-secret';
		mockEnv.TURNSTILE_SKIP = undefined;
		mockEnv.NODE_ENV = 'test';
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('skips verification when TURNSTILE_SKIP=true in non-production', async () => {
		mockEnv.TURNSTILE_SKIP = 'true';

		const result = await verifyTurnstileToken('');

		expect(result).toEqual({ ok: true });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('does not skip in production even when TURNSTILE_SKIP=true', async () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		mockEnv.NODE_ENV = 'production';
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true })
		});

		const result = await verifyTurnstileToken('valid-token', '127.0.0.1');

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('fails when secret key is missing', async () => {
		mockEnv.TURNSTILE_SECRET_KEY = undefined;

		const result = await verifyTurnstileToken('token');

		expect(result).toEqual({ ok: false, messageKey: CAPTCHA_NOT_CONFIGURED_KEY });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('fails when token is empty', async () => {
		const result = await verifyTurnstileToken('   ');

		expect(result).toEqual({ ok: false, messageKey: CAPTCHA_FAILED_KEY });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('posts token to Cloudflare siteverify', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true })
		});

		const result = await verifyTurnstileToken('valid-token', '203.0.113.1');

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledWith(
			'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			})
		);

		const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
		expect(body.get('secret')).toBe('test-secret');
		expect(body.get('response')).toBe('valid-token');
		expect(body.get('remoteip')).toBe('203.0.113.1');
	});

	it('fails when Cloudflare returns success=false', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] })
		});

		const result = await verifyTurnstileToken('bad-token');

		expect(result).toEqual({ ok: false, messageKey: CAPTCHA_FAILED_KEY });
	});

	it('fails on network error', async () => {
		fetchMock.mockRejectedValue(new Error('network down'));

		const result = await verifyTurnstileToken('token');

		expect(result).toEqual({ ok: false, messageKey: CAPTCHA_FAILED_KEY });
	});

	it('accepts Cloudflare always-pass test secret', async () => {
		mockEnv.TURNSTILE_SECRET_KEY = TURNSTILE_TEST_SECRET_KEY;
		vi.unstubAllGlobals();

		const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');

		expect(result).toEqual({ ok: true });
	});
});
