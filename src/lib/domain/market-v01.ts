import { isAdminRole } from '$lib/domain/user';

export const EXPIRING_SHARE_SOURCES = ['manual', 'auto_nearby', 'demo_market'] as const;
export type ExpiringShareSource = (typeof EXPIRING_SHARE_SOURCES)[number];

export const MARKET_V01_PATH = '/grannskafferiet/marknad';

export interface MarketV01AccessUser {
	role?: string | null;
}

type EnvReader = () => string | undefined;

let readMarketV01DisabledEnv: EnvReader = () => undefined;

/** Wire server env reader once at startup (see `market-v01-env.ts`). */
export function configureMarketV01Env(reader: EnvReader): void {
	readMarketV01DisabledEnv = reader;
}

export function isMarketV01DisabledByEnv(): boolean {
	const value = readMarketV01DisabledEnv()?.trim().toLowerCase();
	return value === 'true' || value === '1';
}

export function isMarketV01BackendEnabled(): boolean {
	return !isMarketV01DisabledByEnv();
}

/**
 * UI access for unlisted `/grannskafferiet/marknad/*` routes.
 * Admin always (even without nearby opt-in). Users need nearby opt-in.
 */
export function canAccessMarketV01Ui(
	user: MarketV01AccessUser | null | undefined,
	nearbyEnabled: boolean
): boolean {
	if (!isMarketV01BackendEnabled() || !user) {
		return false;
	}
	if (isAdminRole(user.role)) {
		return true;
	}
	return nearbyEnabled;
}

/** Admin-only nav discovery — never shown to role=user. */
export function showMarketV01InNav(user: MarketV01AccessUser | null | undefined): boolean {
	return isMarketV01BackendEnabled() && isAdminRole(user?.role);
}
