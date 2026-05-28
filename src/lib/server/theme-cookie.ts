import {
	prefersDarkFromRequest,
	resolveTheme,
	type ResolvedTheme,
	type ThemePreference
} from '$lib/domain/theme';

export function resolveThemeForRequest(
	{ request }: { request: Request },
	storedPreference: ThemePreference
): { preference: ThemePreference; resolved: ResolvedTheme } {
	const resolved = resolveTheme(storedPreference, prefersDarkFromRequest(request));
	return { preference: storedPreference, resolved };
}