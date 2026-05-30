export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
	if (preference === 'dark') return 'dark';
	if (preference === 'light') return 'light';
	return prefersDark ? 'dark' : 'light';
}

export function prefersDarkFromRequest(request: Request): boolean {
	const sec = request.headers.get('sec-ch-prefers-color-scheme');
	if (sec === 'dark') return true;
	if (sec === 'light') return false;
	return false;
}

export function isThemePreference(value: string): value is ThemePreference {
	return (THEME_PREFERENCES as readonly string[]).includes(value);
}
