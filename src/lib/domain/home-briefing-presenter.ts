import { formatCadenceWeekday, type HouseholdShoppingCadence } from './household-shopping-cadence';
import { getTimeOfDay, timeOfDayGreetingKey, type TimeOfDay } from './meal-slot';
import type { MessageKey } from '$lib/i18n/messages';
import type { Locale } from '$lib/i18n/locale';
import type { StorageLocation } from './location';
import {
	homeBriefingForYouMessagePrefix,
	homeBriefingStatusMessageKey,
	type HomeBriefingForYouCard,
	type HomeBriefingFunFact,
	type HomeBriefingStatus
} from './home-briefing';

function msg(key: string): MessageKey {
	return key as MessageKey;
}

export interface HomeBriefingMessagePresentation {
	key: MessageKey;
	params: Record<string, string | number>;
}

const GREETING_NEUTRAL_KEYS: Record<TimeOfDay, MessageKey> = {
	morning: 'home.dashboard.greetingMorningOnly',
	day: 'home.dashboard.greetingDayOnly',
	evening: 'home.dashboard.greetingEveningOnly',
	night: 'home.dashboard.greetingNightOnly'
};

export function buildHomeBriefingGreetingPresentation(
	displayName: string | null | undefined,
	date = new Date()
): HomeBriefingMessagePresentation {
	const time = getTimeOfDay(date);
	const trimmed = displayName?.trim();
	if (trimmed) {
		return { key: timeOfDayGreetingKey(time), params: { name: trimmed } };
	}
	return { key: GREETING_NEUTRAL_KEYS[time], params: {} };
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

export type HomeBriefingChipId = 'shopping' | 'storage' | 'eat' | 'funFact';

export interface HomeBriefingChipPresentation {
	id: HomeBriefingChipId;
	titleKey: MessageKey;
	hint?: HomeBriefingMessagePresentation | { kind: 'recipeTitle'; title: string };
	zoneCounts?: Record<StorageLocation, number>;
}

export function buildShoppingChipHint(
	shoppingListCount: number,
	shoppingCadence: HouseholdShoppingCadence | null | undefined,
	locale: Locale
): HomeBriefingMessagePresentation {
	const weekday = shoppingCadence?.weekday;
	if (weekday != null) {
		return {
			key: 'home.v6.chips.shoppingHint',
			params: {
				count: shoppingListCount,
				weekday: formatCadenceWeekday(weekday, locale)
			}
		};
	}
	return {
		key: 'home.v6.chips.shoppingHintNoCadence',
		params: { count: shoppingListCount }
	};
}

export function buildFunFactChipHint(
	funFact: HomeBriefingFunFact | null
): HomeBriefingMessagePresentation {
	if (funFact?.kind === 'zeroWaste') {
		return {
			key: 'home.v6.chips.funFactZeroWaste',
			params: { count: funFact.value }
		};
	}
	if (funFact?.kind === 'consumedThisWeek') {
		return {
			key: 'home.v6.chips.funFactConsumed',
			params: { count: funFact.value }
		};
	}
	return { key: 'home.v6.chips.funFactPlaceholder', params: {} };
}

export function buildHomeBriefingChipsPresentation(input: {
	shoppingListCount: number;
	shoppingCadence: HouseholdShoppingCadence | null | undefined;
	locale: Locale;
	zoneCounts: Record<StorageLocation, number>;
	recipeChip: { id: string; title: string } | null;
	funFact: HomeBriefingFunFact | null;
}): HomeBriefingChipPresentation[] {
	const chips: HomeBriefingChipPresentation[] = [
		{
			id: 'shopping',
			titleKey: 'nav.shopping',
			hint: buildShoppingChipHint(input.shoppingListCount, input.shoppingCadence, input.locale)
		},
		{
			id: 'storage',
			titleKey: 'nav.inventory',
			zoneCounts: input.zoneCounts
		}
	];

	if (input.recipeChip) {
		chips.push({
			id: 'eat',
			titleKey: 'nav.eat',
			hint: { kind: 'recipeTitle', title: input.recipeChip.title }
		});
	}

	chips.push({
		id: 'funFact',
		titleKey: 'home.v6.chips.funFactTitle',
		hint: buildFunFactChipHint(input.funFact)
	});

	return chips;
}
