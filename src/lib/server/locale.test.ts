import { describe, expect, it, vi } from 'vitest';
import { LOCALE_COOKIE_NAME } from '$lib/i18n/locale';
import { resolveLocaleForRequest } from './locale';

function mockCookies(getValue: string | undefined): import('@sveltejs/kit').Cookies {
	return {
		get: vi.fn((name: string) => (name === LOCALE_COOKIE_NAME ? getValue : undefined))
	} as unknown as import('@sveltejs/kit').Cookies;
}

describe('resolveLocaleForRequest', () => {
	it('prefers locale cookie over Accept-Language', () => {
		const cookies = mockCookies('en');
		const request = new Request('https://example.com', {
			headers: { 'accept-language': 'sv-SE,sv;q=0.9' }
		});
		expect(resolveLocaleForRequest(cookies, request)).toBe('en');
	});

	it('falls back to Accept-Language then default sv', () => {
		const svRequest = new Request('https://example.com', {
			headers: { 'accept-language': 'sv-SE,sv;q=0.9,en;q=0.8' }
		});
		expect(resolveLocaleForRequest(mockCookies(undefined), svRequest)).toBe('sv');

		const noHeader = new Request('https://example.com');
		expect(resolveLocaleForRequest(mockCookies(undefined), noHeader)).toBe('sv');
	});

	it('defaults marketing paths to sv without cookie even when Accept-Language prefers en', () => {
		const enRequest = new Request('https://example.com', {
			headers: { 'accept-language': 'en-US,en;q=0.9' }
		});
		expect(
			resolveLocaleForRequest(mockCookies(undefined), enRequest, { marketingPath: true })
		).toBe('sv');
	});
});
