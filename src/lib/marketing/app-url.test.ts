import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPublicEnv } = vi.hoisted(() => ({
	mockPublicEnv: {
		PUBLIC_APP_URL: undefined as string | undefined,
		PUBLIC_ORIGIN: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: mockPublicEnv
}));

import {
	appLoginUrl,
	appRegisterUrl,
	marketingCanonicalUrl,
	resolveAppOrigin
} from './app-url';

describe('resolveAppOrigin', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = undefined;
	});

	it('prefers PUBLIC_APP_URL when set', () => {
		mockPublicEnv.PUBLIC_APP_URL = 'https://app.example/';
		expect(resolveAppOrigin('https://homepantry.com')).toBe('https://app.example');
	});

	it('prefers PUBLIC_ORIGIN over request origin', () => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
		expect(resolveAppOrigin('https://www.homepantry.com')).toBe('https://homepantry.com');
	});

	it('falls back to request origin', () => {
		expect(resolveAppOrigin('https://homepantry.com')).toBe('https://homepantry.com');
	});
});

describe('marketingCanonicalUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = undefined;
	});

	it('builds apex canonical from PUBLIC_ORIGIN', () => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
		expect(marketingCanonicalUrl('/funktioner', 'https://www.homepantry.com')).toBe(
			'https://homepantry.com/funktioner'
		);
	});

	it('uses trailing slash only for root', () => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
		expect(marketingCanonicalUrl('/', 'https://homepantry.com')).toBe('https://homepantry.com');
	});
});

describe('appLoginUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = undefined;
	});

	it('returns relative path on same origin', () => {
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
		expect(appLoginUrl('https://homepantry.com')).toBe('/login');
	});

	it('returns absolute URL when app is on another domain', () => {
		mockPublicEnv.PUBLIC_APP_URL = 'https://app.example';
		expect(appLoginUrl('https://homepantry.com')).toBe('https://app.example/login');
	});
});

describe('appRegisterUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
	});

	it('returns relative path on same origin', () => {
		expect(appRegisterUrl('https://homepantry.com')).toBe('/register');
	});
});
