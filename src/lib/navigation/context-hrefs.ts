import { buildEatFirstWeekUrl } from '$lib/domain/eat-first-week';

import { PANTRY_SHELF_PATH } from './nav-config';

/** Pantry shelf filtered to expiring items. */
export function expiringItemsHref(): string {
	return `${PANTRY_SHELF_PATH}?filter=expiring`;
}

/** Eat-first week planning — `/planer/vecka` with optional inbound source. */
export function eatFirstWeekHref(from?: string): string {
	return buildEatFirstWeekUrl(from);
}
