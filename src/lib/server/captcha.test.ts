import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		TURNSTILE_SECRET_KEY: undefined as string | undefined,
		TURNSTILE_SKIP: undefined as string | undefined,
		NODE_ENV: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import {
	CAPTCHA_NOT_CONFIGURED_MESSAGE,
	CAPTCHA_VERIFY_FAILED_MESSAGE,
	getTurnstileSecretKey,
	isTurnstileSkipEnabled,
	verifyTurnstileToken
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

describe('isTurnstileSkipEnabled', () => {
	beforeEach(() => {
		mockEnv.TURNSTILE_SKIP = undefined;
	});

	it('returns true when TURNSTILE_SKIP=true', () => {
		mockEnv.TURNSTILE_SKIP = 'true';
		expect(isTurnstileSkipEnabled()).toBe(true);
	});

	it('returns false otherwise', () => {
		mockEnv.TURNSTILE_SKIP = 'false';
		expect(isTurnstileSkipEnabled()).toBe(false);
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

		expect(result).toEqual({ ok: false, message: CAPTCHA_NOT_CONFIGURED_MESSAGE });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('fails when token is empty', async () => {
		const result = await verifyTurnstileToken('   ');

		expect(result).toEqual({ ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE });
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

		expect(result).toEqual({ ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE });
	});

	it('fails on network error', async () => {
		fetchMock.mockRejectedValue(new Error('network down'));

		const result = await verifyTurnstileToken('token');

		expect(result).toEqual({ ok: false, message: CAPTCHA_VERIFY_FAILED_MESSAGE });
	});
});
