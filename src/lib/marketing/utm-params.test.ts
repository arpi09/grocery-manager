import { describe, expect, it } from 'vitest';
import { appendSearchParamsToAppPath, pickUtmSearchParams } from './utm-params';

describe('pickUtmSearchParams', () => {
	it('keeps standard utm keys only', () => {
		const input = new URLSearchParams(
			'utm_source=reddit&utm_medium=community&utm_campaign=matsvinn_w12&hero=b&foo=bar'
		);
		const utm = pickUtmSearchParams(input);
		expect(utm.toString()).toBe(
			'utm_source=reddit&utm_medium=community&utm_campaign=matsvinn_w12'
		);
	});

	it('returns empty when no utm present', () => {
		expect([...pickUtmSearchParams(new URLSearchParams('hero=b')).keys()]).toHaveLength(0);
	});
});

describe('appendSearchParamsToAppPath', () => {
	it('appends to relative path', () => {
		const params = new URLSearchParams('utm_source=facebook&utm_medium=community');
		expect(appendSearchParamsToAppPath('/register', params)).toBe(
			'/register?utm_source=facebook&utm_medium=community'
		);
	});

	it('returns path unchanged when params empty', () => {
		expect(appendSearchParamsToAppPath('/login', new URLSearchParams())).toBe('/login');
	});
});
