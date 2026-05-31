import type { Locale } from '$lib/i18n';
import { translate } from '$lib/i18n/messages';

export interface AddMissingApiResult {
	ok: boolean;
	added: number;
	skipped: number;
	error?: string;
}

function normalizeIngredientKey(name: string): string {
	return name.trim().toLowerCase();
}

/** Merge and dedupe missing ingredient names (case-insensitive). */
export function dedupeMissingIngredients(ingredientLists: string[][]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const list of ingredientLists) {
		for (const value of list) {
			if (typeof value !== 'string') {
				continue;
			}
			const trimmed = value.trim().slice(0, 200);
			if (!trimmed) {
				continue;
			}
			const key = normalizeIngredientKey(trimmed);
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			result.push(trimmed);
			if (result.length >= 24) {
				return result;
			}
		}
	}

	return result;
}

export async function addMissingIngredientsToList(
	ingredients: string[]
): Promise<AddMissingApiResult> {
	if (ingredients.length === 0) {
		return { ok: false, added: 0, skipped: 0 };
	}

	try {
		const response = await fetch('/api/recipes/add-missing', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ingredients })
		});

		const data = (await response.json()) as {
			error?: string;
			added?: number;
			skipped?: number;
		};

		if (!response.ok) {
			return {
				ok: false,
				added: 0,
				skipped: 0,
				error: data.error
			};
		}

		return {
			ok: true,
			added: data.added ?? 0,
			skipped: data.skipped ?? 0
		};
	} catch {
		return { ok: false, added: 0, skipped: 0 };
	}
}

export function formatAddMissingFeedback(locale: Locale, result: AddMissingApiResult): string {
	if (!result.ok) {
		return result.error?.trim() || translate(locale, 'recipe.addMissingFailed');
	}

	const { added, skipped } = result;
	if (added === 0 && skipped > 0) {
		return translate(locale, 'recipe.addMissingNone');
	}
	if (skipped > 0) {
		return translate(locale, 'recipe.addMissingPartial', { added, skipped });
	}
	return translate(locale, 'recipe.addMissingSuccess', { count: added });
}
