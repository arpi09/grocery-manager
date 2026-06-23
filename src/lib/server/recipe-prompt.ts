import {
	isExcludedFromRecipes,
	recipeTextMentionsExcludedTerms
} from '$lib/domain/recipe-inventory-filter';
import {
	DEFAULT_RECIPE_PORTIONS,
	MAX_RECIPE_PORTIONS,
	MIN_RECIPE_PORTIONS,
	type MealIntent
} from '$lib/domain/recipe';
import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import type { RecipeSuggestion } from '$lib/server/recipe-suggestions';
import { parseSuggestionQuantity } from '$lib/server/shopping-suggestions';
import {
	PROMPT_VERSION_RECIPE,
	buildStandardJsonUserBlock,
	normalizePromptLocale,
	promptLocaleInstruction,
	promptLocaleTag
} from '$lib/server/ai-prompt-shared';
import type {
	StructuredInventoryPayload,
	VelocityHintRow
} from '$lib/server/inventory-context';

export { DEFAULT_RECIPE_PORTIONS, MAX_RECIPE_PORTIONS, MIN_RECIPE_PORTIONS };

/** Shared culinary rules for draft + refinement LLM passes (exported for tests). */
export const RECIPE_CULINARY_REALISM_RULES = [
	'Föreslå endast mat för människor — aldrig hundmat, kattmat, djurfoder, blommor, växter, städ, diskmedel, hygien eller annat som inte är mat.',
	'Om lagerlistan innehåller konstiga eller icke-matvaror: ignorera dem helt — använd dem inte i recept, titel eller steg.',
	'Föreslå endast realistiska svenska vardagsmåltider, frukost, lunch eller fika — inga absurda kombinationer.',
	'Varje recept ska vara en sammanhängande rätt: alla huvudingredienser ska naturligt passa i samma måltidstyp.',
	'Kombinera inte söta pålägg (sylt, marmelad, choklad, godis) med bröd/baguette som middagsrätt — det är OK som frukost, macka eller fika.',
	'Använd utgående varor som en naturlig del av rätten, inte bara lista dem bredvid orelaterade ingredienser.',
	'Bröd och baguette: macka, smörgås, croutons, brödpudding eller tillbehör — inte som huvudrätt med sylt om lagret räcker till vanlig matlagning.',
	'Undvik att blanda efterrätt/konservering (sylt, dessert) med huvudrätter om inte ett etablerat svenskt recept stödjer det (pannkakor med sylt — inte "baguette med blåbärssylt" som middag).'
] as const;

export function mealIntentGuidance(intent: MealIntent): string {
	switch (intent) {
		case 'friday':
			return 'Måltidsintention: lite finare fredagsmiddag — fortfarande från lagret, men gärna mer smak och presentation än en snabb vardagsrätt.';
		case 'meal_prep':
			return 'Måltidsintention: matlådor / flera portioner / förberedel inför veckan — recept som håller i kyl och går att laga i större batch.';
		default:
			return 'Måltidsintention: snabb vardagsmat — lätt att laga, god vardag, rimlig tid i köket.';
	}
}

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
			const source = item.expiresOnSource ? `, källa: ${item.expiresOnSource}` : '';
			const notes = item.notes ? ` (anteckning: ${item.notes})` : '';
			const stock = parseNumericQuantity(item.quantity);
			const portionHint =
				stock !== null
					? `, typisk måltidsmängd ca ${Math.round(typicalPortionUse(stock, DEFAULT_RECIPE_PORTIONS))}${unit}`
					: '';
			return `- [${item.id}] ${item.name}: ${item.quantity}${unit} kvar i ${item.location}${portionHint}${expires}${source}${notes}`;
		})
		.join('\n');
}

export interface ExpiringFocusRow {
	id: string;
	name: string;
	daysUntilExpiry: number | null;
}

export interface RecipeUserPromptContext {
	locale: string;
	portions: number;
	mealIntent: MealIntent;
	inventoryPayload: StructuredInventoryPayload;
	preferences?: string;
	householdSize?: number;
	recentlyFinished?: string[];
	plannedMeals?: Array<{ date: string; title: string }>;
	avoidTitles?: string[];
	expiringFocus?: ExpiringFocusRow[];
	velocityHints?: VelocityHintRow[];
}

function recipeContextInstruction(locale: string): string {
	return normalizePromptLocale(locale) === 'en'
		? 'Household context for recipe generation. Use exact inventory names in ingredientsToUse (copy name field character-for-character, without id).'
		: 'Hushållskontext för receptgenerering. Använd exakta lagernamn i ingredientsToUse (kopiera name-fältet tecken för tecken, utan id).';
}

export function buildRecipeContextPayload(context: RecipeUserPromptContext): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		portions: context.portions,
		mealIntent: context.mealIntent,
		inventory: context.inventoryPayload.inventory,
		preferences: context.preferences?.trim() || null
	};

	if (context.plannedMeals && context.plannedMeals.length > 0) {
		payload.plannedMeals = context.plannedMeals;
	}
	if (context.avoidTitles && context.avoidTitles.length > 0) {
		payload.avoidTitles = context.avoidTitles;
	}
	if (context.expiringFocus && context.expiringFocus.length > 0) {
		payload.expiringFocus = context.expiringFocus;
	}
	if (context.velocityHints && context.velocityHints.length > 0) {
		payload.velocityHints = context.velocityHints.map((hint) => ({
			displayName: hint.displayName,
			location: hint.location,
			typicalDays: hint.typicalDays,
			sampleCount: hint.sampleCount
		}));
	}
	if (typeof context.householdSize === 'number') {
		payload.householdSize = context.householdSize;
	}
	if (context.recentlyFinished && context.recentlyFinished.length > 0) {
		payload.recentlyFinished = context.recentlyFinished;
	}
	if (context.inventoryPayload.truncated) {
		payload.truncated = context.inventoryPayload.truncated;
	}

	return payload;
}

export interface RecipeSystemPromptOptions {
	requireExpiringFocus?: boolean;
	draftOnly?: boolean;
}

export function buildRecipeSystemPrompt(
	portions: number,
	locale = 'sv',
	options: RecipeSystemPromptOptions = {}
): string {
	const lang = normalizePromptLocale(locale);
	const languageRule =
		lang === 'en'
			? 'All text must be in English (en-GB): title, whyItFits, wastePreventedNote, ingredientsToUse, missingIngredients, steps.'
			: 'All text ska vara på svenska (sv-SE): title, whyItFits, wastePreventedNote, ingredientsToUse, missingIngredients, steps.';
	const draftOnlyRules =
		options.draftOnly
			? [
					lang === 'en'
						? 'Single-pass mode: output must be publication-ready — no placeholders, no vague steps.'
						: 'En-pass-läge: utdata ska vara redo att visa — inga platshållare, inga vaga steg.',
					lang === 'en'
						? 'Double-check every ingredientsToUse name against inventory before returning JSON.'
						: 'Dubbelkolla varje ingredientsToUse-namn mot inventory innan du returnerar JSON.',
					lang === 'en'
						? 'ingredientIds must list inventory ids for every ingredientsToUse entry.'
						: 'ingredientIds ska lista inventory-id för varje ingredientsToUse-rad.'
				]
			: [];
	const eatFirstRule =
		options.requireExpiringFocus
			? [
					lang === 'en'
						? 'Eat-first: each recipe MUST include at least one expiringFocus.id in ingredientIds when expiringFocus is non-empty.'
						: 'Ät-först: varje recept MÅSTE innehålla minst ett expiringFocus.id i ingredientIds när expiringFocus finns.'
				]
			: [];
	return [
		lang === 'en'
			? 'You are a practical home cooking assistant.'
			: 'Du är en praktisk svensk matlagningsassistent för hemmet.',
		`${lang === 'en' ? 'Create up to 4 recipes for exactly' : 'Skapa upp till 4 recept för exakt'} ${portions} ${lang === 'en' ? 'portions' : 'portioner'}.`,
		'Lagerlistan (inventory[].name med id) är den ENDA tillåtna källan för huvudingredienser.',
		'Hitta ALDRIG på varor, varumärken eller ingredienser som inte finns i inventory.',
		'Fältet ingredientsToUse får bara innehålla exakta varunamn från inventory (kopiera name tecken för tecken, utan id).',
		'ingredientIds: array med inventory-id för varje huvudingrediens — måste matcha ingredientsToUse.',
		'Om en ingrediens inte finns i lagret: lägg den INTE i ingredientsToUse — använd missingIngredients eller utelämna.',
		'missingIngredients är endast för små tillbehör som inte finns i lagret (kryddor, olja, citron osv.) — aldrig huvudingredienser som redan finns i lagret.',
		'Vid osäkerhet om exakt varunamn: välj närmaste listade namn eller utelämna — gissa inte och skriv inte "okänd" i ingredientsToUse.',
		'Om avoidTitles finns: generera inte recept med samma eller nästan identiska titlar.',
		'Om recentlyFinished finns: undvik att föreslå samma rätt igen.',
		...eatFirstRule,
		...draftOnlyRules,
		`Skala alla mängder i steps linjärt för exakt ${portions} portioner (inga fasta "4 portioner" om portions skiljer sig).`,
		'Prioritera varor med lågt daysUntilExpiry och minska matsvinn.',
		'Använd realistiska delmängder från lagret — recept ska inte förbruka hela förpackningen om kvantiteten räcker till flera måltider.',
		'Behandla inte en vara som slut eller "behöver köpas" bara för att ett recept använder en liten del.',
		...RECIPE_CULINARY_REALISM_RULES,
		languageRule,
		promptLocaleInstruction(locale),
		`${lang === 'en' ? 'Each recipe must include' : 'Varje recept ska innehålla'}:`,
		'- title (kort rättnamn)',
		'- whyItFits (en kort mening om varför receptet passar lagret)',
		'- wastePreventedNote: kort mening om vilka utgående varor som räddas, annars null',
		'- ingredientsToUse (array med exakta lagernamn)',
		'- ingredientIds (array med inventory-id, samma ordning som ingredientsToUse)',
		'- missingIngredients (array, tom om inget saknas)',
		'- totalMinutes: uppskattad total tid (summa av steps.minutes, eller null)',
		'- difficulty: easy | medium | hard',
		'- steps (5–8 objekt med instruction + valfritt minutes)',
		'Steg-regler:',
		'- 5–8 steg, en tydlig handling per steg',
		lang === 'en'
			? '- Imperative English ("Chop the onion", not "One chops...")'
			: '- Imperativ svenska ("Hacka löken", inte "Man hackar...")',
		'- Mängder i steget där det behövs ("Tillsätt 2 dl grädde")',
		'- minutes (1–120) när rimligt (stek 8 min, vila 5 min)',
		'- Max ~220 tecken per instruction — inga väggar av text',
		'- Upprepa inte samma information mellan steg',
		'Returnera endast giltig JSON i denna form:',
		'{"recipes":[{"title":"","whyItFits":"","wastePreventedNote":null,"ingredientsToUse":[],"ingredientIds":[],"missingIngredients":[],"totalMinutes":30,"difficulty":"easy","steps":[{"instruction":"","minutes":5}]}]}',
		`promptVersion: ${PROMPT_VERSION_RECIPE}`,
		'Inga markdown-kodblock eller förklaringar utanför JSON.'
	].join('\n');
}

export function buildRecipeUserPrompt(context: RecipeUserPromptContext): string {
	const locale = normalizePromptLocale(context.locale);
	const payload = buildRecipeContextPayload(context);
	const mealIntentLine =
		locale === 'en' ? `Meal intent: ${mealIntentGuidanceEn(context.mealIntent)}` : mealIntentGuidance(context.mealIntent);

	return buildStandardJsonUserBlock(
		{ version: PROMPT_VERSION_RECIPE, locale: promptLocaleTag(context.locale) },
		{
			instruction: `${recipeContextInstruction(context.locale)}\n${mealIntentLine}`,
			metadata: JSON.stringify(payload, null, 2)
		}
	);
}

function mealIntentGuidanceEn(intent: MealIntent): string {
	switch (intent) {
		case 'friday':
			return 'slightly nicer Friday dinner from pantry stock';
		case 'meal_prep':
			return 'meal prep / batch cooking for the week';
		default:
			return 'quick weekday meal';
	}
}

export function buildRecipeRefinementSystemPrompt(portions: number, locale = 'sv'): string {
	const lang = normalizePromptLocale(locale);
	return [
		lang === 'en'
			? 'You are an editor reviewing AI-generated recipes against household inventory.'
			: 'Du är en svensk matredaktör som granskar AI-genererade recept mot ett hushålls lager.',
		`Mål: förbättra ett utkast till exakt ${portions} portioner utan att hitta på nya varor.`,
		'Validera ingredientsToUse och ingredientIds mot inventory — ta bort hallucinerade eller felstavade varor.',
		'Korrigera till exakta lagernamn (tecken för tecken som i inventory[].name).',
		'Flytta varor som inte finns i lagret till missingIngredients (aldrig i ingredientsToUse).',
		lang === 'en'
			? 'Improve title to natural dish names (no brands not in inventory).'
			: 'Förbättra title till naturliga svenska rättnamn (ingen engelska, inga varumärken som inte finns i lagret).',
		'Justera steps så mängder och instruktioner matchar portionerna linjärt.',
		'Förbättra steps till 5–8 imperativa steg med tydliga mängder och minutes där det passar.',
		'Behåll whyItFits kort och relevant — nämn utgående varor om de används.',
		'Behåll eller förbättra wastePreventedNote när utgående varor används.',
		'Behåll eller förbättra totalMinutes och difficulty.',
		promptLocaleInstruction(locale),
		`promptVersion: ${PROMPT_VERSION_RECIPE}`,
		...RECIPE_CULINARY_REALISM_RULES,
		'Ta bort eller skriv om recept med orealistiska kombinationer (t.ex. "baguette med blåbärssylt" som middagsrätt när lagret räcker till vanlig matlagning).',
		'Se till att titel, steg och ingredienser hör ihop som frukost, fika, lunch eller middag.',
		'Returnera samma JSON-struktur som utkastet, med samma antal recept (eller färre om ett utkast är omöjligt).',
		'{"recipes":[{"title":"","whyItFits":"","wastePreventedNote":null,"ingredientsToUse":[],"ingredientIds":[],"missingIngredients":[],"totalMinutes":30,"difficulty":"easy","steps":[{"instruction":"","minutes":5}]}]}',
		'Inga markdown-kodblock eller förklaringar utanför JSON.'
	].join('\n');
}

export function buildRecipeRefinementUserPrompt(
	draftJson: string,
	context: RecipeUserPromptContext,
	extraContext?: string
): string {
	const locale = normalizePromptLocale(context.locale);
	const mealIntentLine =
		locale === 'en'
			? `Meal intent: ${mealIntentGuidanceEn(context.mealIntent)}`
			: mealIntentGuidance(context.mealIntent);

	return buildStandardJsonUserBlock(
		{ version: PROMPT_VERSION_RECIPE, locale: promptLocaleTag(context.locale) },
		{
			instruction: [
				recipeContextInstruction(context.locale),
				mealIntentLine,
				'Utkast att granska och förbättra:',
				draftJson,
				extraContext?.trim()
			]
				.filter(Boolean)
				.join('\n\n'),
			metadata: JSON.stringify(buildRecipeContextPayload(context), null, 2)
		}
	);
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

function recipeContentIsExcluded(recipe: RecipeSuggestion): boolean {
	if (recipeTextMentionsExcludedTerms(recipe.title)) {
		return true;
	}
	for (const step of recipe.steps) {
		if (recipeTextMentionsExcludedTerms(step.instruction)) {
			return true;
		}
	}
	for (const ing of recipe.ingredientsToUse) {
		if (isExcludedFromRecipes(ing)) {
			return true;
		}
	}
	return false;
}

export function sanitizeRecipeAgainstInventory(
	recipe: RecipeSuggestion,
	inventoryNames: string[],
	inventoryIds?: Map<string, string>
): RecipeSuggestion | null {
	if (recipeContentIsExcluded(recipe)) {
		return null;
	}

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
		if (isExcludedFromRecipes(trimmed)) {
			return null;
		}
		const canonical = resolveIngredientToInventoryName(trimmed, inventoryNames);
		if (canonical) {
			if (isExcludedFromRecipes(canonical)) {
				return null;
			}
			if (!ingredientsToUse.includes(canonical)) {
				ingredientsToUse.push(canonical);
			}
		} else {
			missingSet.add(trimmed);
		}
	}

	if (recipe.ingredientIds && recipe.ingredientIds.length > 0 && inventoryIds) {
		for (const id of recipe.ingredientIds) {
			const name = inventoryIds.get(id);
			if (!name || isExcludedFromRecipes(name)) continue;
			if (!ingredientsToUse.includes(name)) {
				ingredientsToUse.push(name);
			}
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
	inventoryNames: string[],
	inventoryItems?: InventoryItem[]
): RecipeSuggestion[] {
	const idMap = inventoryItems
		? new Map(inventoryItems.map((item) => [item.id, item.name.trim()]))
		: undefined;
	return recipes
		.map((recipe) => sanitizeRecipeAgainstInventory(recipe, inventoryNames, idMap))
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}

export function missingIngredientToListItem(name: string): CreateShoppingListItemInput {
	const trimmed = name.trim().slice(0, 200);
	const { quantity, unit } = parseSuggestionQuantity('1 st');
	return {
		name: trimmed,
		quantity,
		unit
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
