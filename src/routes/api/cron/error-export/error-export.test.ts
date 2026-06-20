import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv, mockListFullSince } = vi.hoisted(() => ({
	mockEnv: {
		CRON_SECRET: 'cron-test-secret' as string | undefined
	},
	mockListFullSince: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

vi.mock('$lib/server/di', () => ({
	errorLogRepository: {
		listFullSince: mockListFullSince
	}
}));

import { GET } from './+server';

function exportRequest(
	query = 'hours=24&limit=25',
	secret = 'cron-test-secret'
): Parameters<typeof GET>[0] {
	return {
		request: new Request(`http://localhost/api/cron/error-export?${query}`, {
			headers: { Authorization: `Bearer ${secret}` }
		}),
		url: new URL(`http://localhost/api/cron/error-export?${query}`)
	} as Parameters<typeof GET>[0];
}

describe('GET /api/cron/error-export', () => {
	beforeEach(() => {
		mockEnv.CRON_SECRET = 'cron-test-secret';
		mockListFullSince.mockReset();
	});

	it('returns 401 without bearer token', async () => {
		const response = await GET({
			request: new Request('http://localhost/api/cron/error-export'),
			url: new URL('http://localhost/api/cron/error-export')
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(401);
		const body = (await response.json()) as { ok: boolean; error: string };
		expect(body).toEqual({ ok: false, error: 'Unauthorized' });
	});

	it('returns export payload with stack when authorized', async () => {
		const createdAt = new Date('2026-06-20T10:00:00.000Z');
		mockListFullSince.mockResolvedValue([
			{
				id: 'err-1',
				message: 'TypeError: boom',
				stack: 'Error: boom\n    at handler',
				path: '/inkop',
				userId: null,
				statusCode: 500,
				createdAt
			}
		]);

		const response = await GET(exportRequest());
		expect(response.status).toBe(200);

		const body = (await response.json()) as {
			ok: boolean;
			count: number;
			errors: Array<{ id: string; hasStack: boolean; stack: string | null }>;
			prodHint: { note: string };
		};

		expect(body.ok).toBe(true);
		expect(body.count).toBe(1);
		expect(body.errors[0]).toMatchObject({
			id: 'err-1',
			hasStack: true,
			stack: 'Error: boom\n    at handler'
		});
		expect(body.prodHint.note).toContain('deploy SHA');
		expect(mockListFullSince).toHaveBeenCalledOnce();

		const [since, limit] = mockListFullSince.mock.calls[0] as [Date, number];
		expect(since).toBeInstanceOf(Date);
		expect(limit).toBe(25);
	});
});
