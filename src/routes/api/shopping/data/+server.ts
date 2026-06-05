import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

const SECTIONS = ['checked'] as const;
type ShoppingSection = (typeof SECTIONS)[number];

function isSection(value: string | null): value is ShoppingSection {
	return value !== null && SECTIONS.includes(value as ShoppingSection);
}

function serializeItem<T extends { createdAt: Date; updatedAt: Date }>(
	item: T
): Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string } {
	return {
		...item,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const sectionParam = url.searchParams.get('section');
	if (!isSection(sectionParam)) {
		return json({ error: translate(locals.locale, 'errors.api.invalidSection') }, { status: 400 });
	}

	const [items, total] = await Promise.all([
		locals.shoppingListService.listCheckedItems(auth.householdId),
		locals.shoppingListService.countCheckedItems(auth.householdId)
	]);

	return json({
		items: items.map(serializeItem),
		total
	});
};
