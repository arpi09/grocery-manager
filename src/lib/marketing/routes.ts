/** Primary marketing pages (public; logged-in users may view without redirect). */
export const MARKETING_LANDING_PATHS = ['/', '/funktioner', '/sa-fungerar-det', '/faq'] as const;

/** Public marketing routes (no login required; privacy stays reachable when logged in). */
export const PUBLIC_MARKETING_PATHS = [
	...MARKETING_LANDING_PATHS,
	'/minska-matsvinn',
	'/skafferi-app',
	'/kvitto-pdf-kivra',
	'/privacy',
	'/priser'
] as const;

export type MarketingPath = (typeof PUBLIC_MARKETING_PATHS)[number];

export function isGuiderPath(pathname: string): boolean {
	return pathname === '/guider' || pathname.startsWith('/guider/');
}

export function isRapportPath(pathname: string): boolean {
	return /^\/rapport\/\d{4}-\d{2}$/.test(pathname);
}

export function isExpiringSharePath(pathname: string): boolean {
	return pathname.startsWith('/dela/');
}

export function isShoppingListSharePath(pathname: string): boolean {
	return pathname.startsWith('/lista/');
}

export function isPublicCityFeedPath(pathname: string): boolean {
	return pathname === '/delningar' || pathname.startsWith('/delningar/');
}

export function isMarketingPath(pathname: string): boolean {
	return (
		(PUBLIC_MARKETING_PATHS as readonly string[]).includes(pathname) ||
		isRapportPath(pathname) ||
		isGuiderPath(pathname)
	);
}
