import { MARKET_V01_PATH } from '$lib/domain/market-v01';

export const MARKET_SHELL_MESSAGES_PATH = `${MARKET_V01_PATH}/meddelanden`;
export const MARKET_SHELL_PROFILE_PATH = `${MARKET_V01_PATH}/profil`;

export type MarketShellTab = 'map' | 'messages' | 'profile';

/** Routes that render full-screen without market shell tabs (chat thread, listing detail). */
export function isMarketShellFullscreenRoute(pathname: string): boolean {
	return pathname.includes('/marknad/chatt/') || pathname.includes('/marknad/share/');
}

export function isMarketShellRoute(pathname: string): boolean {
	return pathname.startsWith(MARKET_V01_PATH) && !isMarketShellFullscreenRoute(pathname);
}

export function resolveMarketShellTab(pathname: string): MarketShellTab {
	if (pathname.startsWith(MARKET_SHELL_MESSAGES_PATH)) {
		return 'messages';
	}
	if (pathname.startsWith(MARKET_SHELL_PROFILE_PATH)) {
		return 'profile';
	}
	return 'map';
}
