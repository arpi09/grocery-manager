import type { MessageKey } from '$lib/i18n/messages';
import {
	PANTRY_MILESTONE_ITEMS,
	SAVINGS_MILESTONE_SEK,
	STREAK_MILESTONE_WEEKS,
	ZERO_WASTE_STREAK_CELEBRATION,
	type GamificationCelebrationKind,
	type MilestoneId
} from '$lib/domain/gamification';

export type GamificationRegistryKind = 'milestone' | 'metric' | 'celebration';

export type GamificationIllustrationVariant = 'streak' | 'milestone' | 'ritual' | 'savings';

export type CelebrationSurface = 'toast' | 'moment' | 'banner';

export interface GamificationRegistryEntry {
	id: MilestoneId | GamificationCelebrationKind;
	kind: GamificationRegistryKind;
	threshold?: number;
	icon: 'check' | 'sparkle' | 'home' | 'receipt' | 'box';
	i18nKey: MessageKey;
	celebrateKey?: MessageKey;
	illustration: GamificationIllustrationVariant;
	celebrationKind?: GamificationCelebrationKind;
	defaultSurface: CelebrationSurface;
}

export const GAMIFICATION_REGISTRY: GamificationRegistryEntry[] = [
	{
		id: 'firstConsumption',
		kind: 'milestone',
		threshold: 1,
		icon: 'check',
		i18nKey: 'gamification.milestoneFirstConsumption',
		celebrateKey: 'gamification.celebrateFirstConsumption',
		illustration: 'milestone',
		celebrationKind: 'firstConsumption',
		defaultSurface: 'moment'
	},
	{
		id: 'firstReceipt',
		kind: 'milestone',
		threshold: 1,
		icon: 'receipt',
		i18nKey: 'gamification.milestoneFirstReceipt',
		illustration: 'milestone',
		defaultSurface: 'moment'
	},
	{
		id: 'firstPlan',
		kind: 'milestone',
		threshold: 1,
		icon: 'box',
		i18nKey: 'gamification.milestoneFirstPlan',
		illustration: 'ritual',
		defaultSurface: 'moment'
	},
	{
		id: 'pantry10',
		kind: 'milestone',
		threshold: PANTRY_MILESTONE_ITEMS,
		icon: 'home',
		i18nKey: 'gamification.milestonePantry10',
		illustration: 'milestone',
		defaultSurface: 'moment'
	},
	{
		id: 'weeklyRitualFirst',
		kind: 'milestone',
		threshold: 1,
		icon: 'box',
		i18nKey: 'gamification.milestoneWeeklyRitualFirst',
		celebrateKey: 'gamification.celebrateWeeklyRitualFirst',
		illustration: 'ritual',
		celebrationKind: 'weeklyRitualFirst',
		defaultSurface: 'moment'
	},
	{
		id: 'zeroWaste3',
		kind: 'milestone',
		threshold: ZERO_WASTE_STREAK_CELEBRATION,
		icon: 'check',
		i18nKey: 'gamification.milestoneZeroWaste3',
		celebrateKey: 'gamification.celebrateZeroWasteStreak',
		illustration: 'streak',
		celebrationKind: 'zeroWasteStreak',
		defaultSurface: 'moment'
	},
	{
		id: 'savings500',
		kind: 'milestone',
		threshold: SAVINGS_MILESTONE_SEK,
		icon: 'sparkle',
		i18nKey: 'gamification.milestoneSavings500',
		celebrateKey: 'gamification.celebrateSavings500',
		illustration: 'savings',
		celebrationKind: 'savings500',
		defaultSurface: 'moment'
	},
	{
		id: 'streak5',
		kind: 'milestone',
		threshold: STREAK_MILESTONE_WEEKS,
		icon: 'check',
		i18nKey: 'gamification.milestoneStreak5',
		celebrateKey: 'gamification.celebrateStreak5',
		illustration: 'streak',
		celebrationKind: 'streak5',
		defaultSurface: 'moment'
	},
	{
		id: 'eatFirstRitual',
		kind: 'celebration',
		icon: 'box',
		i18nKey: 'gamification.eatFirstRitual',
		celebrateKey: 'gamification.celebrateEatFirstRitual',
		illustration: 'ritual',
		celebrationKind: 'eatFirstRitual',
		defaultSurface: 'toast'
	},
	{
		id: 'zeroWasteStreak',
		kind: 'celebration',
		threshold: ZERO_WASTE_STREAK_CELEBRATION,
		icon: 'check',
		i18nKey: 'gamification.zeroWasteWeeks',
		celebrateKey: 'gamification.celebrateZeroWasteStreak',
		illustration: 'streak',
		celebrationKind: 'zeroWasteStreak',
		defaultSurface: 'moment'
	}
];

const milestoneRegistry = GAMIFICATION_REGISTRY.filter(
	(entry): entry is GamificationRegistryEntry & { id: MilestoneId } => entry.kind === 'milestone'
);

export function getMilestoneRegistryEntry(id: MilestoneId): GamificationRegistryEntry | undefined {
	return milestoneRegistry.find((entry) => entry.id === id);
}

export function getCelebrationRegistryEntry(
	kind: GamificationCelebrationKind
): GamificationRegistryEntry | undefined {
	return GAMIFICATION_REGISTRY.find(
		(entry) => entry.celebrationKind === kind || entry.id === kind
	);
}

export interface NextMilestoneProgress {
	id: MilestoneId;
	current: number;
	target: number;
	illustration: GamificationIllustrationVariant;
}

export function resolveNextMilestone(
	milestones: { id: MilestoneId; achieved: boolean }[],
	signals: {
		totalItems: number;
		zeroWasteWeeks: number | null;
		savedSek: number;
	}
): NextMilestoneProgress | null {
	const next = milestoneRegistry.find(
		(entry) => !milestones.find((m) => m.id === entry.id)?.achieved
	);
	if (!next) {
		return null;
	}

	const target = next.threshold ?? 1;
	let current = 0;

	switch (next.id) {
		case 'pantry10':
			current = signals.totalItems;
			break;
		case 'zeroWaste3':
		case 'streak5':
			current = signals.zeroWasteWeeks ?? 0;
			break;
		case 'savings500':
			current = signals.savedSek;
			break;
		default:
			current = 0;
			break;
	}

	return {
		id: next.id,
		current: Math.min(current, target),
		target,
		illustration: next.illustration
	};
}
