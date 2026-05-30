import { describe, expect, it } from 'vitest';
import { getLocale, initLocale, t } from './locale-store.svelte';

describe('initLocale', () => {
	it('sets locale before translate (SSR path)', () => {
		initLocale('en');
		expect(getLocale()).toBe('en');
		expect(t('auth.login.title')).toBe('Log in');

		initLocale('sv');
		expect(getLocale()).toBe('sv');
		expect(t('auth.login.title')).toBe('Logga in');
	});
});
