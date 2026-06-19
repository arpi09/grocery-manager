import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { RecipeIdea } from '$lib/domain/meal-plan';
import type { Locale } from '$lib/i18n/locale';
import type { HomeBriefingRecipeCard } from './home-briefing';

const DEFAULT_SERVINGS = 2;

function normalizeIngredientName(name: string): string {
	return name.trim().toLowerCase();
}

function ideaUsesExpiringStock(idea: RecipeIdea, expiringSoon: InventoryItem[]): boolean {
	if (expiringSoon.length === 0) {
		return false;
	}

	const expiringKeys = new Set(expiringSoon.map((item) => normalizeIngredientName(item.name)));
	return idea.ingredientsToUse.some((ingredient) =>
		expiringKeys.has(normalizeIngredientName(ingredient))
	);
}

/** Pick a stored recipe idea that uses expiring pantry stock (meal/AI pipeline output). */
export function pickBriefingRecipeIdea(
	ideas: RecipeIdea[],
	expiringSoon: InventoryItem[]
): RecipeIdea | null {
	if (ideas.length === 0 || expiringSoon.length === 0) {
		return null;
	}

	return ideas.find((idea) => ideaUsesExpiringStock(idea, expiringSoon)) ?? null;
}

function matchExpiringNames(idea: RecipeIdea, expiringSoon: InventoryItem[]): string[] {
	const matched = idea.ingredientsToUse.filter((ingredient) =>
		expiringSoon.some(
			(item) => normalizeIngredientName(item.name) === normalizeIngredientName(ingredient)
		)
	);

	return matched.length > 0 ? matched : idea.ingredientsToUse.slice(0, 2);
}

export function buildHomeBriefingRecipeCard(
	idea: RecipeIdea,
	expiringSoon: InventoryItem[],
	shoppingCadence: HouseholdShoppingCadence | null,
	locale: Locale,
	today = new Date()
): HomeBriefingRecipeCard {
	const expiringItemNames = matchExpiringNames(idea, expiringSoon);

	const matchedItems = expiringSoon.filter((item) =>
		idea.ingredientsToUse.some(
			(ingredient) =>
				normalizeIngredientName(ingredient) === normalizeIngredientName(item.name)
		)
	);

	const nearestExpiry = matchedItems
		.filter((item) => item.expiresOn)
		.sort(
			(a, b) =>
				daysUntilExpiry(a.expiresOn!, today) - daysUntilExpiry(b.expiresOn!, today)
		)[0];

	const expiresWhenLabel = nearestExpiry?.expiresOn
		? formatDaysLeft(daysUntilExpiry(nearestExpiry.expiresOn, today), locale)
		: formatDaysLeft(0, locale);

	return {
		kind: 'recipe',
		ideaId: idea.id,
		mealName: idea.title,
		expiringItemNames,
		expiresWhenLabel,
		servings: DEFAULT_SERVINGS,
		missingCount: idea.missingIngredients.length,
		missingIngredients: idea.missingIngredients,
		shopWeekday: shoppingCadence?.weekday ?? null
	};
}

export function homeBriefingRecipeCtaDestination(card: HomeBriefingRecipeCard): string {
	if (card.missingCount > 0 && card.shopWeekday != null) {
		return '/inkop?mode=shop';
	}
	if (card.missingCount > 0) {
		return '/inkop';
	}
	return '/inkop?mode=shop';
}
