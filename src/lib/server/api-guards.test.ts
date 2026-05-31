import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: { OPENAI_API_KEY: undefined as string | undefined }
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import { requireOpenAiKey, requireUser } from './api-guards';

describe('requireUser', () => {
	it('returns 401 JSON when user is missing', async () => {
		const result = requireUser({ user: null, locale: 'en' } as App.Locals);
		expect(result.authorized).toBe(false);
		if (result.authorized) {
			throw new Error('expected unauthorized');
		}
		expect(result.response.status).toBe(401);
		await expect(result.response.json()).resolves.toEqual({
			error: 'You must be logged in.'
		});
	});

	it('returns user when present', () => {
		const user = { id: 'u1' } as App.Locals['user'];
		const result = requireUser({ user, locale: 'en' } as App.Locals);
		expect(result.authorized).toBe(true);
		if (!result.authorized) {
			throw new Error('expected authorized');
		}
		expect(result.user).toBe(user);
	});
});

describe('requireOpenAiKey', () => {
	beforeEach(() => {
		mockEnv.OPENAI_API_KEY = undefined;
	});

	it('returns api key when configured', () => {
		mockEnv.OPENAI_API_KEY = 'sk-test';
		expect(requireOpenAiKey('en', 'recipe suggestions')).toBe('sk-test');
	});

	it('returns 500 JSON by default when key is missing', async () => {
		const response = requireOpenAiKey('en', 'receipt scan');
		expect(typeof response).not.toBe('string');
		if (typeof response === 'string') {
			throw new Error('expected Response');
		}
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe('AI service is not available right now. Try again later.');
	});

	it('returns 503 when requested for product-from-image parity', async () => {
		const response = requireOpenAiKey('en', 'photo product scan', 503);
		expect(typeof response).not.toBe('string');
		if (typeof response === 'string') {
			throw new Error('expected Response');
		}
		expect(response.status).toBe(503);
	});
});
