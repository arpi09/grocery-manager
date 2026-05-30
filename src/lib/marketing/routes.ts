export const MARKETING_PATHS = ['/', '/funktioner', '/sa-fungerar-det', '/faq'] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

export function isMarketingPath(pathname: string): pathname is MarketingPath {
	return (MARKETING_PATHS as readonly string[]).includes(pathname);
}
