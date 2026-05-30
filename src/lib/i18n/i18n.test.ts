import { describe, expect, it } from 'vitest';
import { resolveLocaleFromAcceptLanguage } from './locale';
import { translate } from './messages';

describe('i18n locale resolution', () => {
	it('prefers higher-quality language tag', () => {
		expect(resolveLocaleFromAcceptLanguage('en-US,en;q=0.9,sv;q=0.8')).toBe('en');
		expect(resolveLocaleFromAcceptLanguage('sv-SE,sv;q=0.9,en;q=0.8')).toBe('sv');
	});

	it('returns null when no supported locale', () => {
		expect(resolveLocaleFromAcceptLanguage('de-DE,de;q=0.9')).toBeNull();
		expect(resolveLocaleFromAcceptLanguage(null)).toBeNull();
	});
});

describe('i18n translate', () => {
	it('returns Swedish strings by default locale catalog', () => {
		expect(translate('sv', 'auth.login.title')).toBe('Logga in');
	});

	it('falls back to Swedish when English key is missing', () => {
		expect(translate('en', 'auth.login.title')).toBe('Log in');
	});

	it('interpolates params and plural rules', () => {
		expect(translate('sv', 'dashboard.itemCount', { count: 1 })).toBe('1 vara');
		expect(translate('sv', 'dashboard.itemCount', { count: 3 })).toBe('3 varor');
		expect(translate('en', 'dashboard.totalTracked', { count: 5 })).toBe('5 items tracked');
	});
});
