import {
	DEFAULT_RECIPE_PORTIONS,
	MAX_RECIPE_PORTIONS,
	MIN_RECIPE_PORTIONS
} from '$lib/domain/recipe';
import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import type { RecipeSuggestion } from '$lib/server/recipe-suggestions';

export { DEFAULT_RECIPE_PORTIONS, MAX_RECIPE_PORTIONS, MIN_RECIPE_PORTIONS };

/** Shared culinary rules for draft + refinement LLM passes (exported for tests). */
export const RECIPE_CULINARY_REALISM_RULES = [
	'Föreslå endast realistiska svenska vardagsmåltider, frukost, lunch eller fika — inga absurda kombinationer.',
	'Varje recept ska vara en sammanhängande rätt: alla huvudingredienser ska naturligt passa i samma måltidstyp.',
	'Kombinera inte söta pålägg (sylt, marmelad, choklad, godis) med bröd/baguette som middagsrätt — det är OK som frukost, macka eller fika.',
	'Använd utgående varor som en naturlig del av rätten, inte bara lista dem bredvid orelaterade ingredienser.',
	'Bröd och baguette: macka, smörgås, croutons, brödpudding eller tillbehör — inte som huvudrätt med sylt om lagret räcker till vanlig matlagning.',
	'Undvik att blanda efterrätt/konservering (sylt, dessert) med huvudrätter om inte ett etablerat svenskt recept stödjer det (pannkakor med sylt — inte "baguette med blåbärssylt" som middag).'
] as const;

export function clampRecipePortions(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return DEFAULT_RECIPE_PORTIONS;
	}
	return Math.min(MAX_RECIPE_PORTIONS, Math.max(MIN_RECIPE_PORTIONS, Math.round(value)));
}

export function normalizeIngredientName(name: string): string {
	return name.trim().toLowerCase();
}

export function inventoryNameList(items: InventoryItem[]): string[] {
	return items.map((item) => item.name.trim()).filter(Boolean);
}

export function typicalPortionUse(stock: number, portions: number): number {
	const perPortion = stock / Math.max(portions, 1);
	return Math.max(Math.min(perPortion * 0.35, stock * 0.25), stock * 0.05);
}

export function formatRecipeInventoryLines(items: InventoryItem[]): string {
	if (items.length === 0) {
		return '(tomt lager)';
	}

	return items
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const expires = item.expiresOn ? `, utgår ${item.expiresOn}` : '';
			const notes = item.notes ? ` (anteckning: ${item.notes})` : '';
			const stock = parseNumericQuantity(item.quantity);
			const portionHint =
				stock !== null
					? `, typisk måltidsmängd ca ${Math.round(typicalPortionUse(stock, DEFAULT_RECIPE_PORTIONS))}${unit}`
					: '';
			return `- [${item.id}] ${item.name}: ${item.quantity}${unit} kvar i ${item.location}${portionHint}${expires}${notes}`;
		})
		.join('\n');
}

export function buildRecipeSystemPrompt(portions: number): string {
	return [
		'Du är en praktisk svensk matlagningsassistent för hemmet.',
		`Skapa upp till 4 recept för exakt ${portions} portioner.`,
		'Lagerlistan (med [id] och varunamn) är den ENDA tillåtna källan för huvudingredienser.',
		'Hitta ALDRIG på varor, varumärken eller ingredienser som inte finns i lagerlistan.',
		'Fältet ingredientsToUse får bara innehålla exakta varunamn från lagerlistan (kopiera tecken för tecken, utan [id]).',
		'Om en ingrediens inte finns i lagret: lägg den INTE i ingredientsToUse — använd missingIngredients eller utelämna.',
		'missingIngredients är endast för små tillbehör som inte finns i lagret (kryddor, olja, citron osv.) — aldrig huvudingredienser som redan finns i lagret.',
		'Vid osäkerhet om exakt varunamn: välj närmaste listade namn eller utelämna — gissa inte och skriv inte "okänd" i ingredientsToUse.',
		`Skala alla mängder i steps linjärt för exakt ${portions} portioner (inga fasta "4 portioner" om portions skiljer sig).`,
		'Prioritera varor med utgångsdatum och minska matsvinn.',
		'Använd realistiska delmängder från lagret — recept ska inte förbruka hela förpackningen om kvantiteten räcker till flera måltider.',
		'Behandla inte en vara som slut eller "behöver köpas" bara för att ett recept använder en liten del.',
		...RECIPE_CULINARY_REALISM_RULES,
		'All text ska vara på svenska (sv-SE): title, whyItFits, ingredientsToUse, missingIngredients, steps.',
		'Varje recept ska innehålla:',
		'- title (kort rättnamn)',
		'- whyItFits (en kort mening om varför receptet passar lagret)',
		'- ingredientsToUse (array med exakta lagernamn)',
		'- missingIngredients (array, tom om inget saknas)',
		'- steps (korta steg som strängar, mängder anpassade till portionerna)',
		'Returnera endast giltig JSON i denna form:',
		'{"recipes":[{"title":"","whyItFits":"","ingredientsToUse":[],"missingIngredients":[],"steps":[]}]}',
		'Inga markdown-kodblock eller förklaringar utanför JSON.'
	].join('\n');
}

export function buildRecipeUserPrompt(
	inventoryLines: string,
	portions: number,
	preferences: string
): string {
	const parts = [
		`Antal portioner: ${portions}`,
		'Lager (enda tillåtna källor för ingredientsToUse — kopiera varunamn exakt):',
		inventoryLines
	];
	if (preferences) {
		parts.push(`Användarens önskemål: ${preferences}`);
	}
	return parts.join('\n\n');
}

export function buildRecipeRefinementSystemPrompt(portions: number): string {
	return [
		'Du är en svensk matredaktör som granskar AI-genererade recept mot ett hushålls lager.',
		`Mål: förbättra ett utkast till exakt ${portions} portioner utan att hitta på nya varor.`,
		'Validera ingredientsToUse mot lagerlistan — ta bort hallucinerade eller felstavade varor.',
		'Korrigera till exakta lagernamn (svenska, tecken för tecken som i listan).',
		'Flytta varor som inte finns i lagret till missingIngredients (aldrig i ingredientsToUse).',
		'Förbättra title till naturliga svenska rättnamn (ingen engelska, inga varumärken som inte finns i lagret).',
		'Justera steps så mängder och instruktioner matchar portionerna linjärt.',
		'Behåll whyItFits kort och relevant — nämn utgående varor om de används.',
		...RECIPE_CULINARY_REALISM_RULES,
		'Ta bort eller skriv om recept med orealistiska kombinationer (t.ex. "baguette med blåbärssylt" som middagsrätt när lagret räcker till vanlig matlagning).',
		'Se till att titel, steg och ingredienser hör ihop som frukost, fika, lunch eller middag.',
		'Returnera samma JSON-struktur som utkastet, med samma antal recept (eller färre om ett utkast är omöjligt).',
		'{"recipes":[{"title":"","whyItFits":"","ingredientsToUse":[],"missingIngredients":[],"steps":[]}]}',
		'Inga markdown-kodblock eller förklaringar utanför JSON.'
	].join('\n');
}

export function buildRecipeRefinementUserPrompt(
	draftJson: string,
	inventoryLines: string,
	portions: number,
	extraContext?: string
): string {
	const parts = [
		`Antal portioner: ${portions}`,
		'Lager (enda tillåtna källor för ingredientsToUse):',
		inventoryLines,
		'Utkast att granska och förbättra:',
		draftJson
	];
	if (extraContext?.trim()) {
		parts.push(extraContext.trim());
	}
	return parts.join('\n\n');
}

export function ingredientMatchesInventory(ingredient: string, inventoryNames: string[]): boolean {
	return resolveIngredientToInventoryName(ingredient, inventoryNames) !== null;
}

/** Map model ingredient text to the canonical inventory name, or null if not in stock. */
export function resolveIngredientToInventoryName(
	ingredient: string,
	inventoryNames: string[]
): string | null {
	const norm = normalizeIngredientName(ingredient);
	if (!norm) {
		return null;
	}
	for (const name of inventoryNames) {
		const inv = normalizeIngredientName(name);
		if (inv === norm || inv.includes(norm) || norm.includes(inv)) {
			return name.trim();
		}
	}
	return null;
}

export function sanitizeRecipeAgainstInventory(
	recipe: RecipeSuggestion,
	inventoryNames: string[]
): RecipeSuggestion | null {
	const ingredientsToUse: string[] = [];
	const missingSet = new Set<string>();

	for (const ing of recipe.missingIngredients) {
		const trimmed = ing.trim();
		if (trimmed) {
			missingSet.add(trimmed);
		}
	}

	for (const ing of recipe.ingredientsToUse) {
		const trimmed = ing.trim();
		if (!trimmed) {
			continue;
		}
		const canonical = resolveIngredientToInventoryName(trimmed, inventoryNames);
		if (canonical) {
			if (!ingredientsToUse.includes(canonical)) {
				ingredientsToUse.push(canonical);
			}
		} else {
			missingSet.add(trimmed);
		}
	}

	const missingIngredients = [...missingSet].filter(
		(ing) => !ingredientMatchesInventory(ing, inventoryNames)
	);

	if (ingredientsToUse.length === 0 || recipe.steps.length === 0) {
		return null;
	}

	return {
		...recipe,
		ingredientsToUse,
		missingIngredients
	};
}

export function sanitizeRecipesAgainstInventory(
	recipes: RecipeSuggestion[],
	inventoryNames: string[]
): RecipeSuggestion[] {
	return recipes
		.map((recipe) => sanitizeRecipeAgainstInventory(recipe, inventoryNames))
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}

export function missingIngredientToListItem(name: string): CreateShoppingListItemInput {
	const trimmed = name.trim().slice(0, 200);
	return {
		name: trimmed,
		quantity: '1 st',
		unit: null
	};
}

export function parseMissingIngredientsPayload(input: unknown): string[] {
	if (!input || typeof input !== 'object') {
		return [];
	}
	const ingredients = (input as { ingredients?: unknown }).ingredients;
	if (!Array.isArray(ingredients)) {
		return [];
	}
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of ingredients) {
		if (typeof value !== 'string') {
			continue;
		}
		const trimmed = value.trim().slice(0, 200);
		if (!trimmed) {
			continue;
		}
		const key = normalizeIngredientName(trimmed);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		result.push(trimmed);
		if (result.length >= 24) {
			break;
		}
	}
	return result;
}
