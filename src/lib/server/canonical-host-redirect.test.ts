import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPublicEnv } = vi.hoisted(() => ({
	mockPublicEnv: {
		PUBLIC_APP_URL: undefined as string | undefined,
		PUBLIC_ORIGIN: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: mockPublicEnv
}));

import { resolveCanonicalHostRedirect } from './canonical-host-redirect';

describe('resolveCanonicalHostRedirect', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = 'https://skaffu.com';
	});

	it('redirects legacy hosted.app hostname to PUBLIC_ORIGIN', () => {
		const url = new URL(
			'https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app/funktioner?utm=1'
		);
		expect(resolveCanonicalHostRedirect(url)).toBe(
			'https://skaffu.com/funktioner?utm=1'
		);
	});

	it('redirects www.skaffu.com to apex', () => {
		const url = new URL('https://www.skaffu.com/faq');
		expect(resolveCanonicalHostRedirect(url)).toBe('https://skaffu.com/faq');
	});

	it('skips redirect on canonical skaffu.com apex', () => {
		const url = new URL('https://skaffu.com/');
		expect(resolveCanonicalHostRedirect(url)).toBeNull();
	});

	it('skips redirect for unrelated hostnames', () => {
		const url = new URL('http://localhost:5173/login');
		expect(resolveCanonicalHostRedirect(url)).toBeNull();
	});
});
