import { describe, expect, it } from 'vitest';
import { deriveHomeState } from './home-state';

describe('deriveHomeState', () => {
	it('returns cold when pantry is empty', () => {
		expect(deriveHomeState({ totalItems: 0, expiringCount: 0, shoppingListCount: 3 })).toBe('cold');
	});
	it('returns expiry when items expire soon', () => {
		expect(deriveHomeState({ totalItems: 5, expiringCount: 2, shoppingListCount: 1 })).toBe('expiry');
	});
	it('returns lista_ready when list has unchecked items', () => {
		expect(deriveHomeState({ totalItems: 5, expiringCount: 0, shoppingListCount: 2 })).toBe('lista_ready');
	});
	it('returns steady for engaged pantry without urgency', () => {
		expect(deriveHomeState({ totalItems: 5, expiringCount: 0, shoppingListCount: 0 })).toBe('steady');
	});
});
