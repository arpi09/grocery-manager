import type { InventoryItem } from '$lib/domain/inventory-item';

/** Multi-word or distinctive substrings — safe without word boundaries. */
const EXCLUDED_COMPOUND_KEYWORDS = [
	'hundmat',
	'kattmat',
	'hundfoder',
	'kattfoder',
	'djurfoder',
	'djurmat',
	'diskmedel',
	'tvättmedel',
	'tvättpulver',
	'maskindisk',
	'handdisk',
	'allrengör',
	'blekmedel',
	'rengöringsmedel',
	'rengörings',
	'wc-block',
	'wc block',
	'bukett',
	'krukväxt',
	'snittblomma',
	'tandkräm',
	'tandkram',
	'tampong',
	'deodorant',
	'duschgel',
	'schampo',
	'handtvål',
	'handtval',
	'batteri',
	'batterier',
	'knappcell',
	'kattsand',
	'hundsand',
	'kattspray',
	'fiskfoder',
	'fågelmat',
	'fagelmat'
] as const;

/** Whole-word patterns (case-insensitive) for shorter Swedish terms. */
const EXCLUDED_WORD_PATTERNS = [
	/\bhund\b/i,
	/\bkatt\b/i,
	/\bdjur\b/i,
	/\bfoder\b/i,
	/\bblomma\b/i,
	/\bblommor\b/i,
	/\brosor\b/i,
	/\bstäd\b/i,
	/\bstad\b/i,
	/\btvätt\b/i,
	/\btvatt\b/i,
	/\bhygien\b/i,
	/\bblöja\b/i,
	/\bbloja\b/i
] as const;

const FOOD_EXCEPTIONS = ['blomkål', 'blomkal', 'rosmarin', 'rosé', 'rose', 'rosévin', 'rosvin'] as const;

function normalizedHaystack(name: string, notes?: string | null): string {
	const parts = [name, notes ?? ''].map((part) => part.trim().toLowerCase()).filter(Boolean);
	return parts.join(' ');
}

function hasFoodException(haystack: string): boolean {
	return FOOD_EXCEPTIONS.some((term) => haystack.includes(term));
}

export function isExcludedFromRecipes(name: string, notes?: string | null): boolean {
	const haystack = normalizedHaystack(name, notes);
	if (!haystack) {
		return false;
	}

	if (hasFoodException(haystack)) {
		return false;
	}

	for (const keyword of EXCLUDED_COMPOUND_KEYWORDS) {
		if (haystack.includes(keyword)) {
			return true;
		}
	}

	for (const pattern of EXCLUDED_WORD_PATTERNS) {
		if (pattern.test(haystack)) {
			return true;
		}
	}

	return false;
}

export function filterInventoryForRecipes(items: InventoryItem[]): InventoryItem[] {
	return items.filter((item) => !isExcludedFromRecipes(item.name, item.notes));
}

export function recipeTextMentionsExcludedTerms(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed) {
		return false;
	}
	return isExcludedFromRecipes(trimmed);
}
