import type { Locale } from '$lib/i18n/locale';
import { translate, type MessageKey } from '$lib/i18n/messages';
import type { GamificationCelebrationKind } from '$lib/domain/gamification';

export const CELEBRATE_PARAM = 'celebrate';

const CELEBRATION_KEYS: Record<GamificationCelebrationKind, MessageKey> = {
	firstConsumption: 'gamification.celebrateFirstConsumption',
	zeroWasteStreak: 'gamification.celebrateZeroWasteStreak',
	eatFirstRitual: 'gamification.celebrateEatFirstRitual',
	weeklyRitualFirst: 'gamification.celebrateWeeklyRitualFirst',
	savings500: 'gamification.celebrateSavings500',
	streak5: 'gamification.celebrateStreak5',
	syncWeek: 'gamification.celebrateSyncWeek'
};

export function parseCelebrationKind(value: string | null): GamificationCelebrationKind | null {
	if (!value) return null;
	if (value in CELEBRATION_KEYS) {
		return value as GamificationCelebrationKind;
	}
	return null;
}

export function appendCelebration(path: string, kind: GamificationCelebrationKind): string {
	const url = new URL(path, 'http://local');
	url.searchParams.set(CELEBRATE_PARAM, kind);
	return `${url.pathname}${url.search}`;
}

export function celebrationMessage(
	locale: Locale,
	kind: GamificationCelebrationKind,
	options?: { count?: number; weeks?: number; sek?: number }
): string {
	const key = CELEBRATION_KEYS[kind];
	if (kind === 'zeroWasteStreak' || kind === 'streak5') {
		return translate(locale, key, {
			count: options?.count ?? options?.weeks ?? (kind === 'streak5' ? 5 : 3)
		});
	}
	if (kind === 'savings500') {
		return translate(locale, key, { sek: options?.sek ?? 500 });
	}
	return translate(locale, key);
}
