import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		ORIGIN: undefined as string | undefined,
		PUBLIC_ORIGIN: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import { getAppOrigin } from './origin';

describe('getAppOrigin', () => {
	beforeEach(() => {
		mockEnv.ORIGIN = undefined;
		mockEnv.PUBLIC_ORIGIN = undefined;
		delete process.env.ORIGIN;
		delete process.env.PUBLIC_ORIGIN;
	});

	it('prefers ORIGIN over PUBLIC_ORIGIN', () => {
		mockEnv.ORIGIN = 'https://origin.example/';
		mockEnv.PUBLIC_ORIGIN = 'https://public.example';
		expect(getAppOrigin()).toBe('https://origin.example');
	});

	it('falls back to request origin', () => {
		mockEnv.PUBLIC_ORIGIN = 'https://public.example';
		expect(getAppOrigin('http://localhost:5173')).toBe('https://public.example');
	});

	it('uses fallback when env is unset', () => {
		expect(getAppOrigin('http://localhost:5173')).toBe('http://localhost:5173');
	});
});
