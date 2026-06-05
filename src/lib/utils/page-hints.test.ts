import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	PAGE_HINT_IDS,
	dismissPageHint,
	resolvePageHintId,
	resetPageHints,
	shouldShowPageHint
} from './page-hints';

const TEST_USER = 'user-a';

describe('page hints', () => {
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

	it('resolves hint ids from pathname', () => {
		expect(resolvePageHintId('/hem')).toBe('hem');
		expect(resolvePageHintId('/inkop')).toBe('inkop');
		expect(resolvePageHintId('/planer')).toBe('planer');
		expect(resolvePageHintId('/statistik')).toBe('statistik');
		expect(resolvePageHintId('/inventory/fridge')).toBe('inventory');
		expect(resolvePageHintId('/scan')).toBeNull();
		expect(resolvePageHintId('/settings')).toBeNull();
	});

	it('requires userId to evaluate hint visibility', () => {
		expect(shouldShowPageHint('hem')).toBe(false);
		expect(shouldShowPageHint('hem', null)).toBe(false);
	});

	it('shows hint until dismissed', () => {
		expect(shouldShowPageHint('hem', TEST_USER)).toBe(true);
		dismissPageHint('hem', TEST_USER);
		expect(shouldShowPageHint('hem', TEST_USER)).toBe(false);
	});

	it('keeps hint state scoped per surface', () => {
		dismissPageHint('hem', TEST_USER);
		expect(shouldShowPageHint('inkop', TEST_USER)).toBe(true);
	});

	it('resets all hints for one user', () => {
		for (const hintId of PAGE_HINT_IDS) {
			dismissPageHint(hintId, TEST_USER);
		}
		resetPageHints(TEST_USER);
		for (const hintId of PAGE_HINT_IDS) {
			expect(shouldShowPageHint(hintId, TEST_USER)).toBe(true);
		}
	});
});
