/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isSameOriginReferrer, navigateBack } from './navigate-back';

const goto = vi.fn();

vi.mock('$app/navigation', () => ({
	goto: (href: string) => goto(href)
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

describe('isSameOriginReferrer', () => {
	it('returns false when referrer is empty', () => {
		expect(isSameOriginReferrer('', 'https://app.skaffu.se')).toBe(false);
	});

	it('returns true for same-origin referrer', () => {
		expect(isSameOriginReferrer('https://app.skaffu.se/planer', 'https://app.skaffu.se')).toBe(
			true
		);
	});

	it('returns false for cross-origin referrer', () => {
		expect(isSameOriginReferrer('https://example.com/link', 'https://app.skaffu.se')).toBe(false);
	});

	it('returns false for invalid referrer', () => {
		expect(isSameOriginReferrer('not-a-url', 'https://app.skaffu.se')).toBe(false);
	});
});

describe('navigateBack', () => {
	beforeEach(() => {
		goto.mockReset();
		vi.spyOn(history, 'back').mockImplementation(() => undefined);
		Object.defineProperty(window, 'location', {
			value: { origin: 'https://app.skaffu.se' },
			writable: true,
			configurable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('uses history.back when referrer is same-origin', async () => {
		Object.defineProperty(document, 'referrer', {
			value: 'https://app.skaffu.se/planer',
			configurable: true
		});

		await navigateBack('/planer');

		expect(history.back).toHaveBeenCalledOnce();
		expect(goto).not.toHaveBeenCalled();
	});

	it('navigates to fallback when referrer is external', async () => {
		Object.defineProperty(document, 'referrer', {
			value: 'https://mail.google.com/',
			configurable: true
		});

		await navigateBack('/planer');

		expect(history.back).not.toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/planer');
	});

	it('navigates to fallback when referrer is empty', async () => {
		Object.defineProperty(document, 'referrer', { value: '', configurable: true });

		await navigateBack('/hem');

		expect(history.back).not.toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/hem');
	});
});
