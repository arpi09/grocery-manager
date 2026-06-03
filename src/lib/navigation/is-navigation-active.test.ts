import { describe, expect, it } from 'vitest';
import { isNavigationActive } from './is-navigation-active';

describe('isNavigationActive', () => {
	it('is false when complete is null (idle navigating state)', () => {
		expect(isNavigationActive({ complete: null })).toBe(false);
	});

	it('is true when complete promise is set', () => {
		expect(isNavigationActive({ complete: Promise.resolve() })).toBe(true);
	});

	it('is false for same-path query-only navigations (e.g. admin tabs)', () => {
		const url = (path: string, search = '') => new URL(`https://example.com${path}${search}`);
		expect(
			isNavigationActive({
				complete: Promise.resolve(),
				from: { url: url('/admin', '?tab=users') },
				to: { url: url('/admin', '?tab=logs') }
			})
		).toBe(false);
	});

	it('is true when pathname changes', () => {
		const url = (path: string) => new URL(`https://example.com${path}`);
		expect(
			isNavigationActive({
				complete: Promise.resolve(),
				from: { url: url('/hem') },
				to: { url: url('/scan') }
			})
		).toBe(true);
	});
});
