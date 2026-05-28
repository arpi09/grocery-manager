import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4.1-mini';

interface RecipeSuggestion {
	title: string;
	whyItFits: string;
	ingredientsToUse: string[];
	missingIngredients: string[];
	steps: string[];
}

function safeParseSuggestions(input: unknown): RecipeSuggestion[] {
	if (!input || typeof input !== 'object') {
		return [];
	}

	const recipes = (input as { recipes?: unknown }).recipes;
	if (!Array.isArray(recipes)) {
		return [];
	}

	return recipes
		.map((recipe) => {
			if (!recipe || typeof recipe !== 'object') {
				return null;
			}

			const candidate = recipe as Record<string, unknown>;
			const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
			const whyItFits =
				typeof candidate.whyItFits === 'string' ? candidate.whyItFits.trim() : '';
			const ingredientsToUse = Array.isArray(candidate.ingredientsToUse)
				? candidate.ingredientsToUse.filter((v): v is string => typeof v === 'string')
				: [];
			const missingIngredients = Array.isArray(candidate.missingIngredients)
				? candidate.missingIngredients.filter((v): v is string => typeof v === 'string')
				: [];
			const steps = Array.isArray(candidate.steps)
				? candidate.steps.filter((v): v is string => typeof v === 'string')
				: [];

			if (!title || !whyItFits || ingredientsToUse.length === 0 || steps.length === 0) {
				return null;
			}

			return {
				title,
				whyItFits,
				ingredientsToUse,
				missingIngredients,
				steps
			};
		})
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}

function safeParseModelJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return json(
			{
				error:
					'OPENAI_API_KEY is missing. Add it to your .env before generating recipe suggestions.'
			},
			{ status: 500 }
		);
	}

	const body = (await request.json().catch(() => ({}))) as { preferences?: unknown };
	const preferences = typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			recipes: [],
			note: 'No inventory items found yet. Add items first, then generate recipes.'
		});
	}

	const inventoryLines = inventory
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const notes = item.notes ? ` (notes: ${item.notes})` : '';
			return `- ${item.name}: ${item.quantity}${unit} in ${item.location}${notes}`;
		})
		.join('\n');

	const prompt = [
		'You are a practical home-cooking assistant.',
		'Create up to 4 recipes based primarily on available inventory.',
		'Prefer recipes that minimize waste and prioritize items with expiry dates.',
		'Each recipe must include:',
		'- title',
		'- whyItFits (short sentence)',
		'- ingredientsToUse (from inventory)',
		'- missingIngredients (optional extras the user may need)',
		'- steps (concise numbered-like instructions as plain strings)',
		'Return valid JSON only in this shape:',
		'{"recipes":[{"title":"","whyItFits":"","ingredientsToUse":[],"missingIngredients":[],"steps":[]}]}',
		'Do not include markdown code fences.'
	].join('\n');

	const inputText = [
		'Inventory:',
		inventoryLines,
		preferences ? `\nPreferences from user: ${preferences}` : ''
	].join('\n');

	const response = await fetch(OPENAI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: MODEL,
			input: [
				{
					role: 'system',
					content: [{ type: 'input_text', text: prompt }]
				},
				{
					role: 'user',
					content: [{ type: 'input_text', text: inputText }]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'recipe_suggestions',
					schema: {
						type: 'object',
						properties: {
							recipes: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										title: { type: 'string' },
										whyItFits: { type: 'string' },
										ingredientsToUse: {
											type: 'array',
											items: { type: 'string' }
										},
										missingIngredients: {
											type: 'array',
											items: { type: 'string' }
										},
										steps: {
											type: 'array',
											items: { type: 'string' }
										}
									},
									required: [
										'title',
										'whyItFits',
										'ingredientsToUse',
										'missingIngredients',
										'steps'
									],
									additionalProperties: false
								}
							}
						},
						required: ['recipes'],
						additionalProperties: false
					}
				}
			}
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		return json(
			{ error: `OpenAI request failed: ${response.status} ${errorText.slice(0, 300)}` },
			{ status: 502 }
		);
	}

	const payload = (await response.json()) as { output_text?: unknown };
	const outputText = typeof payload.output_text === 'string' ? payload.output_text : '';
	const parsed = safeParseModelJson(outputText);
	const recipes = safeParseSuggestions(parsed);

	if (recipes.length === 0) {
		return json(
			{
				error: 'Could not generate structured recipes from the model response. Please try again.'
			},
			{ status: 502 }
		);
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(locals.user.id, recipes);

	return json({ recipes: savedIdeas });
};
