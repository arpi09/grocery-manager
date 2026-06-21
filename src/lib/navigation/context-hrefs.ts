import { buildEatFirstWeekUrl } from '$lib/domain/eat-first-week';

import { PANTRY_SHELF_PATH } from './nav-config';

export interface ExpiringItemsHrefOptions {
	pantryUxV2Enabled?: boolean;
}

/** Pantry shelf or legacy fridge view filtered to expiring items. */
export function expiringItemsHref(options: ExpiringItemsHrefOptions = {}): string {
	if (options.pantryUxV2Enabled) {
		return `${PANTRY_SHELF_PATH}?filter=expiring`;
	}
	return '/inventory/fridge?filter=expiring';
}

/** Eat-first week planning — `/planer/vecka` with optional inbound source. */
export function eatFirstWeekHref(from?: string): string {
	return buildEatFirstWeekUrl(from);
}
