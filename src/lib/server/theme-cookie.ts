import type { Cookies } from '@sveltejs/kit';
import {
	prefersDarkFromRequest,
	resolveTheme,
	type ResolvedTheme,
	type ThemePreference
} from '$lib/domain/theme';
import { readThemeCookie } from '$lib/infrastructure/theme-cookie';

export function resolveThemeForRequest(
	{ cookies, request }: { cookies: Cookies; request: Request },
	storedPreference: ThemePreference | null
): { preference: ThemePreference; resolved: ResolvedTheme } {
	const cookiePreference = readThemeCookie(cookies);
	const preference = storedPreference ?? cookiePreference ?? 'system';
	const resolved = resolveTheme(preference, prefersDarkFromRequest(request));
	return { preference, resolved };
}
