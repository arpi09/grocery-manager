import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	INVENTORY_SWIPE_HINT_MAX_VIEWS,
	markInventorySwipeDiscovered,
	recordInventorySwipeHintShown,
	shouldShowInventorySwipeHint
} from './inventory-swipe-hint';

const TEST_USER = 'user-a';

describe('inventory swipe hint', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('never shows without a user id', () => {
		expect(shouldShowInventorySwipeHint()).toBe(false);
		expect(shouldShowInventorySwipeHint(null)).toBe(false);
	});

	it('shows at most twice per user', () => {
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(true);
		recordInventorySwipeHintShown(TEST_USER);
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(true);
		recordInventorySwipeHintShown(TEST_USER);
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(false);
	});

	it('scopes the counter per user', () => {
		for (let i = 0; i < INVENTORY_SWIPE_HINT_MAX_VIEWS; i += 1) {
			recordInventorySwipeHintShown(TEST_USER);
		}
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(false);
		expect(shouldShowInventorySwipeHint('user-b')).toBe(true);
	});

	it('stops showing once the user swiped themselves', () => {
		markInventorySwipeDiscovered(TEST_USER);
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(false);
	});

	it('recovers from garbage stored values', () => {
		storage[`home-pantry-inventory-swipe-hint-count:${TEST_USER}`] = 'garbage';
		expect(shouldShowInventorySwipeHint(TEST_USER)).toBe(true);
	});
});
