import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
import { daysUntilExpiry } from '$lib/domain/expiry';
import type { MessageKey } from '$lib/i18n/messages';
import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';

export type HomeBriefingStatusKey =
	| 'useSoonAndList'
	| 'useSoonOnly'
	| 'listReady'
	| 'listItems'
	| 'allGood'
	| 'emptyPantry';

export interface HomeBriefingStatus {
	key: HomeBriefingStatusKey;
	useSoonCount?: number;
	count?: number;
	weekday?: number;
}

export type HomeBriefingForYouKind = 'recipe' | 'replenishment' | 'expiring' | 'shopReady';

export interface HomeBriefingRecipeCard {
	kind: 'recipe';
	ideaId: string;
	mealName: string;
	expiringItemNames: string[];
	expiresWhenLabel: string;
	servings: number;
	missingCount: number;
	missingIngredients: string[];
	shopWeekday: number | null;
}

export interface HomeBriefingReplenishmentCard {
	kind: 'replenishment';
	suggestion: ReplenishmentSuggestion;
}

export interface HomeBriefingExpiringCard {
	kind: 'expiring';
	item: InventoryItem;
	daysUntilExpiry: number;
	suggestion: string;
}

export interface HomeBriefingShopReadyCard {
	kind: 'shopReady';
	itemCount: number;
	weekday: number;
}

export type HomeBriefingForYouCard =
	| HomeBriefingRecipeCard
	| HomeBriefingReplenishmentCard
	| HomeBriefingExpiringCard
	| HomeBriefingShopReadyCard;

export interface HomeBriefingInput {
	totalItems: number;
	useSoonCount: number;
	shoppingListCount: number;
	shoppingCadence: HouseholdShoppingCadence | null;
	intelligence: Pick<HomeIntelligenceSnapshot, 'replenishment'>;
	expiringSoon: InventoryItem[];
	recipeSuggestion?: HomeBriefingRecipeCard | null;
	today?: Date;
}

export function isShoppingListReady(
	shoppingListCount: number,
	shoppingCadence: HouseholdShoppingCadence | null
): boolean {
	return shoppingListCount > 0 && shoppingCadence != null;
}

/** Select a single calm status line key for the briefing hero. */
export function selectHomeBriefingStatus(input: HomeBriefingInput): HomeBriefingStatus {
	const {
		totalItems,
		useSoonCount,
		shoppingListCount,
		shoppingCadence
	} = input;

	if (totalItems === 0) {
		return { key: 'emptyPantry' };
	}

	const listReady = isShoppingListReady(shoppingListCount, shoppingCadence);

	if (useSoonCount > 0 && listReady) {
		return {
			key: 'useSoonAndList',
			useSoonCount,
			weekday: shoppingCadence!.weekday
		};
	}

	if (useSoonCount > 0) {
		return { key: 'useSoonOnly', count: useSoonCount };
	}

	if (listReady) {
		return { key: 'listReady', weekday: shoppingCadence!.weekday };
	}

	if (shoppingListCount > 0) {
		return { key: 'listItems', count: shoppingListCount };
	}

	return { key: 'allGood' };
}

function defaultExpiringSuggestion(item: InventoryItem): string {
	return item.location;
}

/** Pick exactly one primary För dig card — recipe → replenishment → expiring → shop ready. */
export function selectHomeBriefingForYouCard(
	input: HomeBriefingInput
): HomeBriefingForYouCard | null {
	const today = input.today ?? new Date();

	if (input.recipeSuggestion) {
		return input.recipeSuggestion;
	}

	const replenishment = input.intelligence.replenishment[0];
	if (replenishment) {
		return { kind: 'replenishment', suggestion: replenishment };
	}

	const expiringItem = input.expiringSoon[0];
	if (expiringItem?.expiresOn) {
		return {
			kind: 'expiring',
			item: expiringItem,
			daysUntilExpiry: daysUntilExpiry(expiringItem.expiresOn, today),
			suggestion: defaultExpiringSuggestion(expiringItem)
		};
	}

	if (isShoppingListReady(input.shoppingListCount, input.shoppingCadence)) {
		return {
			kind: 'shopReady',
			itemCount: input.shoppingListCount,
			weekday: input.shoppingCadence!.weekday
		};
	}

	return null;
}

export function homeBriefingStatusMessageKey(status: HomeBriefingStatus): MessageKey {
	return `home.v6.status.${status.key}` as MessageKey;
}

export function homeBriefingForYouMessagePrefix(kind: HomeBriefingForYouKind): `home.v6.forYou.${HomeBriefingForYouKind}` {
	return `home.v6.forYou.${kind}`;
}

export type HomeBriefingMomentKind =
	| 'emptyPantry'
	| 'scanReceipt'
	| 'photoRound'
	| 'planMeal'
	| 'openShopping'
	| 'seeStats';

export interface HomeBriefingMomentCard {
	kind: HomeBriefingMomentKind;
}

const QUIET_MOMENT_KINDS: HomeBriefingMomentKind[] = [
	'scanReceipt',
	'photoRound',
	'planMeal',
	'seeStats'
];

function calendarDayIndex(date: Date): number {
	const start = new Date(date.getFullYear(), 0, 0);
	const diff = date.getTime() - start.getTime();
	return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickQuietMomentKind(today: Date, shoppingListCount: number): HomeBriefingMomentCard {
	if (shoppingListCount > 0) {
		return { kind: 'openShopping' };
	}
	const index = calendarDayIndex(today) % QUIET_MOMENT_KINDS.length;
	return { kind: QUIET_MOMENT_KINDS[index]! };
}

/** Pick a calm moment card when nothing urgent is surfaced in För dig. */
export function selectHomeBriefingMomentCard(input: HomeBriefingInput): HomeBriefingMomentCard | null {
	if (selectHomeBriefingForYouCard(input)) {
		return null;
	}

	const today = input.today ?? new Date();

	if (input.totalItems === 0) {
		return { kind: 'emptyPantry' };
	}

	return pickQuietMomentKind(today, input.shoppingListCount);
}

export function homeBriefingMomentMessagePrefix(
	kind: HomeBriefingMomentKind
): `home.v6.moment.${HomeBriefingMomentKind}` {
	return `home.v6.moment.${kind}`;
}

export type HomeBriefingFunFactKind = 'zeroWaste' | 'consumedThisWeek';

export interface HomeBriefingFunFact {
	kind: HomeBriefingFunFactKind;
	value: number;
}

/** Pick the simplest rotating fun stat for the Snabbkoll chip. */
export function selectHomeBriefingFunFact(impact: {
	zeroWasteWeeks: number | null;
	consumedThisWeek: number | null;
}): HomeBriefingFunFact | null {
	if (impact.zeroWasteWeeks != null && impact.zeroWasteWeeks > 0) {
		return { kind: 'zeroWaste', value: impact.zeroWasteWeeks };
	}
	if (impact.consumedThisWeek != null && impact.consumedThisWeek > 0) {
		return { kind: 'consumedThisWeek', value: impact.consumedThisWeek };
	}
	return null;
}
