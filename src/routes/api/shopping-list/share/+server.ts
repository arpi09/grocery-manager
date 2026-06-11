import { json } from '@sveltejs/kit';
import { canEditInventory } from '$lib/domain/household';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { shoppingListShareService } from '$lib/server/di';
import { recordProductEvent } from '$lib/server/product-events';
import { isShoppingListShareEnabled } from '$lib/server/shopping-list-share-flag';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	if (!isShoppingListShareEnabled()) {
		return json({ ok: false, error: translate(locals.locale, 'errors.api.invalidRequest') }, { status: 404 });
	}

	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.unauthorized') },
			{ status: 400 }
		);
	}

	if (!locals.householdRole || !canEditInventory(locals.householdRole)) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.unauthorized') },
			{ status: 403 }
		);
	}

	const [unchecked, checked] = await Promise.all([
		locals.shoppingListService.listUncheckedItems(locals.householdId),
		locals.shoppingListService.listCheckedItems(locals.householdId)
	]);
	const items = [...unchecked, ...checked];

	const share = await shoppingListShareService.createShareLink(
		locals.householdId,
		auth.user.id,
		items
	);

	if (!share) {
		return json(
			{ ok: false, error: translate(locals.locale, 'shoppingListShare.noItems') },
			{ status: 400 }
		);
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'shopping_list_share_created',
		metadata: { itemCount: share.itemCount }
	});

	return json({
		ok: true,
		url: `${url.origin}${share.urlPath}`,
		urlPath: share.urlPath,
		expiresAt: share.expiresAt.toISOString(),
		itemCount: share.itemCount
	});
};
