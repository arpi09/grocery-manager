import { describe, expect, it } from 'vitest';
import { isNavigationActive } from './is-navigation-active';

describe('isNavigationActive', () => {
	it('is false when complete is null (idle navigating state)', () => {
		expect(isNavigationActive({ complete: null })).toBe(false);
	});

	it('is true when complete promise is set', () => {
		expect(isNavigationActive({ complete: Promise.resolve() })).toBe(true);
	});
});
