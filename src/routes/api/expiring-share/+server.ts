import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService } from '$lib/server/di';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	if (!locals.householdId) {
		return json({ ok: false, error: translate(locals.locale, 'errors.api.unauthorized') }, { status: 400 });
	}

	const inventory = await locals.inventoryService.listAll(locals.householdId);
	const share = await expiringShareService.createShareLink(
		locals.householdId,
		locals.user!.id,
		inventory
	);

	if (!share) {
		return json(
			{ ok: false, error: translate(locals.locale, 'expiringShare.noItems') },
			{ status: 400 }
		);
	}

	recordProductEvent(locals.pmfService, {
		userId: locals.user!.id,
		householdId: locals.householdId,
		eventType: 'expiring_share_created',
		metadata: { itemCount: share.itemCount }
	});

	return json({
		ok: true,
		url: `${url.origin}${share.urlPath}`,
		expiresAt: share.expiresAt.toISOString(),
		itemCount: share.itemCount
	});
};
