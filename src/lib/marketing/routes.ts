/** Primary marketing pages (public; logged-in users may view without redirect). */
export const MARKETING_LANDING_PATHS = ['/', '/funktioner', '/sa-fungerar-det', '/faq'] as const;

/** Public marketing routes (no login required; privacy stays reachable when logged in). */
export const PUBLIC_MARKETING_PATHS = [...MARKETING_LANDING_PATHS, '/privacy', '/priser'] as const;

export type MarketingPath = (typeof PUBLIC_MARKETING_PATHS)[number];

export function isMarketingPath(pathname: string): pathname is MarketingPath {
	return (PUBLIC_MARKETING_PATHS as readonly string[]).includes(pathname);
}
