import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import {
	formatInventoryLines,
	formatPlannedMealLines,
	formatRecipeIdeaLines,
	upcomingDateRange
} from '$lib/server/inventory-context';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requestStructuredJson } from '$lib/server/openai';
import type { RequestHandler } from './$types';

const ICA_CATEGORIES = [
	'Frukt & grönt',
	'Mejeri',
	'Kött & chark',
	'Fisk & skaldjur',
	'Bröd & bakverk',
	'Skafferi',
	'Dryck',
	'Fryst',
	'Övrigt'
] as const;

type IcaCategory = (typeof ICA_CATEGORIES)[number];

interface IcaShoppingItem {
	name: string;
	quantity: string;
	category: IcaCategory;
	reason: string;
	priority: 'high' | 'medium' | 'low';
	searchQuery: string;
}

function parseCategory(value: unknown): IcaCategory {
	if (typeof value === 'string' && ICA_CATEGORIES.includes(value as IcaCategory)) {
		return value as IcaCategory;
	}
	return 'Övrigt';
}

function parseShoppingList(input: unknown): IcaShoppingItem[] {
	if (!input || typeof input !== 'object') {
		return [];
	}

	const items = (input as { items?: unknown }).items;
	if (!Array.isArray(items)) {
		return [];
	}

	return items
		.map((row) => {
			if (!row || typeof row !== 'object') {
				return null;
			}
			const candidate = row as Record<string, unknown>;
			const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
			const quantity = typeof candidate.quantity === 'string' ? candidate.quantity.trim() : '';
			const reason = typeof candidate.reason === 'string' ? candidate.reason.trim() : '';
			const searchQuery =
				typeof candidate.searchQuery === 'string'
					? candidate.searchQuery.trim()
					: name;
			const priority =
				candidate.priority === 'high' || candidate.priority === 'low'
					? candidate.priority
					: 'medium';

			if (!name || !quantity || !reason || !searchQuery) {
				return null;
			}

			return {
				name,
				quantity,
				category: parseCategory(candidate.category),
				reason,
				priority,
				searchQuery
			};
		})
		.filter((item): item is IcaShoppingItem => item !== null)
		.slice(0, 24);
}

function parseNote(input: unknown): string | null {
	if (!input || typeof input !== 'object') {
		return null;
	}
	const note = (input as { note?: unknown }).note;
	return typeof note === 'string' && note.trim() ? note.trim() : null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey('ICA shopping list');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const body = (await request.json().catch(() => ({}))) as {
		preferences?: unknown;
		householdSize?: unknown;
	};
	const preferences =
		typeof body.preferences === 'string' ? body.preferences.trim().slice(0, 300) : '';
	const householdSize =
		typeof body.householdSize === 'number' && body.householdSize >= 1 && body.householdSize <= 8
			? Math.round(body.householdSize)
			: 2;

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	const { fromDate, toDate } = upcomingDateRange(10);
	const [plannedMeals, recipeIdeas] = await Promise.all([
		locals.mealPlanService.listPlannedMealsByRange(auth.user.id, fromDate, toDate),
		locals.mealPlanService.listRecipeIdeas(auth.user.id, 8)
	]);

	const userPrompt = [
		'Current inventory (do NOT suggest items already well stocked):',
		formatInventoryLines(inventory),
		'',
		`Planned meals (${fromDate} to ${toDate}):`,
		formatPlannedMealLines(plannedMeals),
		'',
		'Recipe ideas (use missingIngredients heavily):',
		formatRecipeIdeaLines(recipeIdeas),
		'',
		`Household size: ${householdSize} people`,
		preferences ? `Shopping preferences: ${preferences}` : ''
	].join('\n');

	const systemPrompt = [
		'You build a practical shopping list for ICA (Swedish grocery store).',
		'Product names must sound like real ICA product search terms in Swedish (brand optional, common sizes).',
		'Suggest items that are missing, running low, needed for planned meals, or common staples worth restocking.',
		'Do not duplicate what the user clearly already has in sufficient quantity.',
		'Group mentally by ICA store departments.',
		'Respond in Swedish for name, quantity, reason; searchQuery should be a short ICA-friendly search phrase.',
		'Return JSON only:',
		'{"note":"","items":[{"name":"","quantity":"","category":"Frukt & grönt|Mejeri|Kött & chark|Fisk & skaldjur|Bröd & bakverk|Skafferi|Dryck|Fryst|Övrigt","reason":"","priority":"high|medium|low","searchQuery":""}]}',
		'Rules:',
		'- 6 to 20 items, prioritized for one ICA trip',
		'- note: optional short shopping tip (can be empty string)',
		'- quantity examples: "1 st", "500 g", "2 förpackningar"',
		'- no markdown code fences'
	].join('\n');

	const result = await requestStructuredJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'ica_shopping_list',
		schema: {
			type: 'object',
			properties: {
				note: { type: 'string' },
				items: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							quantity: { type: 'string' },
							category: { type: 'string', enum: [...ICA_CATEGORIES] },
							reason: { type: 'string' },
							priority: { type: 'string', enum: ['high', 'medium', 'low'] },
							searchQuery: { type: 'string' }
						},
						required: ['name', 'quantity', 'category', 'reason', 'priority', 'searchQuery'],
						additionalProperties: false
					}
				}
			},
			required: ['note', 'items'],
			additionalProperties: false
		}
	});

	if (!result.ok) {
		return json({ error: result.message }, { status: result.status });
	}

	const items = parseShoppingList(result.data);
	if (items.length === 0) {
		return json(
			{ error: translate(locals.locale, 'errors.api.icaFailed') },
			{ status: 502 }
		);
	}

	return json({
		items,
		note: parseNote(result.data),
		generatedAt: new Date().toISOString()
	});
};
