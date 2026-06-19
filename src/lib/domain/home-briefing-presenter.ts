import { formatCadenceWeekday, type HouseholdShoppingCadence } from './household-shopping-cadence';
import type { MessageKey } from '$lib/i18n/messages';
import type { Locale } from '$lib/i18n/locale';
import {
	homeBriefingForYouMessagePrefix,
	homeBriefingStatusMessageKey,
	type HomeBriefingForYouCard,
	type HomeBriefingStatus
} from './home-briefing';

function msg(key: string): MessageKey {
	return key as MessageKey;
}

export interface HomeBriefingMessagePresentation {
	key: MessageKey;
	params: Record<string, string | number>;
}

export function buildHomeBriefingGreetingPresentation(
	displayName: string | null | undefined
): HomeBriefingMessagePresentation {
	const trimmed = displayName?.trim();
	if (trimmed) {
		return { key: 'home.v6.greeting', params: { name: trimmed } };
	}
	return { key: 'home.v6.greetingFallback', params: {} };
}

export function buildHomeBriefingStatusPresentation(
	status: HomeBriefingStatus,
	locale: Locale
): HomeBriefingMessagePresentation {
	const key = homeBriefingStatusMessageKey(status);

	switch (status.key) {
		case 'useSoonAndList':
			return {
				key,
				params: {
					useSoonCount: status.useSoonCount ?? 0,
					weekday: formatCadenceWeekday(status.weekday ?? 0, locale)
				}
			};
		case 'listReady':
			return {
				key,
				params: { weekday: formatCadenceWeekday(status.weekday ?? 0, locale) }
			};
		case 'useSoonOnly':
		case 'listItems':
			return { key, params: { count: status.count ?? 0 } };
		default:
			return { key, params: {} };
	}
}

function formatWeekday(weekday: number | null | undefined, locale: Locale): string {
	if (weekday == null) return '';
	return formatCadenceWeekday(weekday, locale);
}

export function buildHomeBriefingForYouPresentation(
	card: HomeBriefingForYouCard,
	locale: Locale
): {
	title: HomeBriefingMessagePresentation;
	body: HomeBriefingMessagePresentation;
	cta: HomeBriefingMessagePresentation;
} {
	const prefix = homeBriefingForYouMessagePrefix(card.kind);

	switch (card.kind) {
		case 'recipe': {
			const weekday = formatWeekday(card.shopWeekday, locale);
			const ctaKey =
				card.missingCount > 0 && weekday
					? `${prefix}.ctaAddAndShop`
					: card.missingCount > 0
						? `${prefix}.ctaAdd`
						: `${prefix}.ctaShop`;
			const ctaParams: Record<string, string | number> =
				ctaKey === `${prefix}.ctaAddAndShop`
					? { missingCount: card.missingCount, weekday }
					: ctaKey === `${prefix}.ctaAdd`
						? { missingCount: card.missingCount }
						: {};

			return {
				title: { key: msg(`${prefix}.title`), params: { mealName: card.mealName } },
				body: {
					key: msg(`${prefix}.body`),
					params: {
						items: card.expiringItemNames.join(', '),
						when: card.expiresWhenLabel,
						servings: card.servings
					}
				},
				cta: { key: msg(ctaKey), params: ctaParams }
			};
		}
		case 'replenishment':
			return {
				title: { key: msg(`${prefix}.title`), params: { name: card.suggestion.displayName } },
				body: {
					key: msg(`${prefix}.body`),
					params: { interval: card.suggestion.avgIntervalDays ?? card.suggestion.daysSinceLast }
				},
				cta: { key: msg(`${prefix}.cta`), params: {} }
			};
		case 'expiring':
			return {
				title: { key: msg(`${prefix}.title`), params: { name: card.item.name } },
				body: {
					key: msg(`${prefix}.body`),
					params: { days: card.daysUntilExpiry, suggestion: card.suggestion }
				},
				cta: { key: msg(`${prefix}.cta`), params: {} }
			};
		case 'shopReady':
			return {
				title: { key: msg(`${prefix}.title`), params: {} },
				body: {
					key: msg(`${prefix}.body`),
					params: {
						count: card.itemCount,
						weekday: formatCadenceWeekday(card.weekday, locale)
					}
				},
				cta: { key: msg(`${prefix}.cta`), params: {} }
			};
	}
}

export function buildShoppingChipTripName(
	shoppingCadence: HouseholdShoppingCadence | null | undefined
): string | null {
	if (!shoppingCadence) return null;
	return shoppingCadence.storeLabel?.trim() || null;
}

export function buildHomeBriefingChipsPresentation(input: {
	useSoonCount: number;
	shoppingCadence: HouseholdShoppingCadence | null | undefined;
	locale: Locale;
}): {
	useSoon: HomeBriefingMessagePresentation;
	shopping: { useTripName: boolean; tripName: string };
} {
	const tripName = buildShoppingChipTripName(input.shoppingCadence);
	if (tripName) {
		return {
			useSoon: { key: 'home.v6.chips.useSoon', params: { count: input.useSoonCount } },
			shopping: { useTripName: true, tripName }
		};
	}

	const weekday = input.shoppingCadence?.weekday;
	if (weekday != null) {
		return {
			useSoon: { key: 'home.v6.chips.useSoon', params: { count: input.useSoonCount } },
			shopping: {
				useTripName: true,
				tripName: formatCadenceWeekday(weekday, input.locale)
			}
		};
	}

	return {
		useSoon: { key: 'home.v6.chips.useSoon', params: { count: input.useSoonCount } },
		shopping: { useTripName: false, tripName: '' }
	};
}
