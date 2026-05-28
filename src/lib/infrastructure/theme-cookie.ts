import type { Cookies } from '@sveltejs/kit';
import { isThemePreference, type ThemePreference } from '$lib/domain/theme';

export const THEME_COOKIE_NAME = 'pantry_theme';

export function readThemeCookie(cookies: Cookies): ThemePreference | null {
	const value = cookies.get(THEME_COOKIE_NAME);
	if (!value || !isThemePreference(value)) return null;
	return value;
}

export function writeThemeCookie(cookies: Cookies, preference: ThemePreference): void {
	cookies.set(THEME_COOKIE_NAME, preference, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: false,
		sameSite: 'lax'
	});
}