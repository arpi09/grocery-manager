import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		CRON_SECRET: 'cron-test-secret' as string | undefined,
		OPENAI_API_KEY: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import { GET } from './+server';

function healthRequest(secret = 'cron-test-secret'): Request {
	return new Request('http://localhost/api/health/ai', {
		headers: { Authorization: `Bearer ${secret}` }
	});
}

describe('GET /api/health/ai', () => {
	beforeEach(() => {
		mockEnv.CRON_SECRET = 'cron-test-secret';
		mockEnv.OPENAI_API_KEY = undefined;
	});

	it('returns 401 without bearer token', async () => {
		const response = await GET({ request: new Request('http://localhost/api/health/ai') } as never);
		expect(response.status).toBe(401);
	});

	it('returns 503 when OPENAI_API_KEY is unset', async () => {
		const response = await GET({ request: healthRequest() } as never);
		const body = (await response.json()) as { ok: boolean; configured: boolean };

		expect(response.status).toBe(503);
		expect(body).toEqual({ ok: false, configured: false });
	});

	it('returns 200 when OPENAI_API_KEY is configured', async () => {
		mockEnv.OPENAI_API_KEY = 'sk-test';
		const response = await GET({ request: healthRequest() } as never);
		const body = (await response.json()) as { ok: boolean; configured: boolean };

		expect(response.status).toBe(200);
		expect(body).toEqual({ ok: true, configured: true });
	});
});
