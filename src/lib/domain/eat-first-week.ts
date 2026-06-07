/** Meal suggestions shown in the eat-first week view (Mon–Fri planning). */
export const EAT_FIRST_WEEK_MIN_MEALS = 3;
export const EAT_FIRST_WEEK_MAX_MEALS = 5;

export const EAT_FIRST_WEEK_PATH = '/planer/vecka';

export type EatFirstWeekInboundSource = 'push' | 'email' | 'hero' | 'planer';

const INBOUND_SOURCES = new Set<EatFirstWeekInboundSource>(['push', 'email', 'hero', 'planer']);

/**
 * Scale AI meal count (3–5) with how urgent expiry is — more expiring items → more slots.
 */
export function resolveEatFirstWeekMealCount(expiringCount: number): number {
	if (expiringCount <= 0) {
		return EAT_FIRST_WEEK_MIN_MEALS;
	}
	if (expiringCount <= 2) {
		return EAT_FIRST_WEEK_MIN_MEALS;
	}
	if (expiringCount <= 4) {
		return 4;
	}
	return EAT_FIRST_WEEK_MAX_MEALS;
}

export function buildEatFirstWeekUrl(from?: EatFirstWeekInboundSource | string): string {
	if (!from) {
		return EAT_FIRST_WEEK_PATH;
	}
	return `${EAT_FIRST_WEEK_PATH}?from=${encodeURIComponent(from)}`;
}

export function parseEatFirstWeekInboundSource(
	value: string | null | undefined
): EatFirstWeekInboundSource | null {
	if (!value) {
		return null;
	}
	return INBOUND_SOURCES.has(value as EatFirstWeekInboundSource)
		? (value as EatFirstWeekInboundSource)
		: null;
}

export function shouldShowEatFirstWeekInboundBanner(
	source: EatFirstWeekInboundSource | null
): source is EatFirstWeekInboundSource {
	return source === 'push' || source === 'email';
}
