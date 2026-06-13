import { afterEach, describe, expect, it, vi } from 'vitest';
import { isHouseholdFavoritesEnabled } from './household-favorites-flag';

describe('household-favorites-flag', () => {
	const original = process.env.HOUSEHOLD_FAVORITES_ENABLED;

	afterEach(() => {
		if (original === undefined) {
			delete process.env.HOUSEHOLD_FAVORITES_ENABLED;
		} else {
			process.env.HOUSEHOLD_FAVORITES_ENABLED = original;
		}
		vi.resetModules();
	});

	it('defaults to disabled', () => {
		delete process.env.HOUSEHOLD_FAVORITES_ENABLED;
		expect(isHouseholdFavoritesEnabled()).toBe(false);
	});

	it('enables when env is true', () => {
		process.env.HOUSEHOLD_FAVORITES_ENABLED = 'true';
		expect(isHouseholdFavoritesEnabled()).toBe(true);
	});
});
