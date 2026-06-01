import { describe, expect, it, vi } from 'vitest';
import { COOKIE_CONSENT_NAME } from '$lib/cookie-consent';
import { ANALYTICS_VISITOR_COOKIE, getOrSetAnalyticsVisitorId } from './analytics-visitor';

function mockCookies(values: Record<string, string | undefined>) {
	const jar = new Map(Object.entries(values).filter(([, v]) => v !== undefined));
	return {
		get: vi.fn((name: string) => jar.get(name)),
		set: vi.fn((name: string, value: string) => {
			jar.set(name, value);
		})
	} as unknown as import('@sveltejs/kit').Cookies;
}

describe('getOrSetAnalyticsVisitorId', () => {
	it('does not set visitor cookie without analytics consent', () => {
		const cookies = mockCookies({});
		expect(getOrSetAnalyticsVisitorId(cookies)).toBeNull();
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('sets visitor cookie when consent is all', () => {
		const cookies = mockCookies({ [COOKIE_CONSENT_NAME]: 'all' });
		const id = getOrSetAnalyticsVisitorId(cookies);
		expect(id).toBeTruthy();
		expect(cookies.set).toHaveBeenCalledWith(
			ANALYTICS_VISITOR_COOKIE,
			expect.any(String),
			expect.objectContaining({ path: '/' })
		);
	});

	it('returns existing visitor id without re-setting when consent is all', () => {
		const cookies = mockCookies({
			[COOKIE_CONSENT_NAME]: 'all',
			[ANALYTICS_VISITOR_COOKIE]: 'visitor-123'
		});
		expect(getOrSetAnalyticsVisitorId(cookies)).toBe('visitor-123');
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('does not use visitor cookie when consent is essential only', () => {
		const cookies = mockCookies({
			[COOKIE_CONSENT_NAME]: 'essential',
			[ANALYTICS_VISITOR_COOKIE]: 'visitor-123'
		});
		expect(getOrSetAnalyticsVisitorId(cookies)).toBeNull();
	});
});
