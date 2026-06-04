import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		CRON_SECRET: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import { isCronAuthorized } from './cron-auth';

describe('isCronAuthorized', () => {
	beforeEach(() => {
		mockEnv.CRON_SECRET = 'test-cron-secret';
	});

	it('accepts Bearer header', () => {
		const request = new Request('https://example.com/api/cron/expiry-reminders', {
			headers: { Authorization: 'Bearer test-cron-secret' }
		});
		expect(isCronAuthorized(request)).toBe(true);
	});

	it('rejects missing secret', () => {
		const request = new Request('https://example.com/api/cron/expiry-reminders');
		expect(isCronAuthorized(request)).toBe(false);
	});

	it('rejects query-string secret (log leakage)', () => {
		const request = new Request(
			'https://example.com/api/cron/expiry-reminders?secret=test-cron-secret'
		);
		expect(isCronAuthorized(request)).toBe(false);
	});
});
