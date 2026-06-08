import { json } from '@sveltejs/kit';
import { InventoryNotFoundError } from '$lib/application/inventory.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import {
	trackBatchReviewCompleted,
	trackInventoryWrite,
	trackStalenessConfirmed
} from '$lib/server/sync-analytics';
import type { RequestHandler } from './$types';

function serializeItem<T extends { createdAt: Date; updatedAt: Date; lastConfirmedAt: Date }>(
	item: T
) {
	return {
		...item,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString(),
		lastConfirmedAt: item.lastConfirmedAt.toISOString()
	};
}

export const GET: RequestHandler = async ({ locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const [items, remaining] = await Promise.all([
		locals.inventoryService.listStaleUndatedBatch(auth.householdId),
		locals.inventoryService.countStaleUndated(auth.householdId)
	]);

	return json({
		items: items.map(serializeItem),
		remaining
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	let body: { action?: unknown; itemId?: unknown; itemIds?: unknown; batchComplete?: unknown };
	try {
		body = (await request.json()) as {
			action?: unknown;
			itemId?: unknown;
			itemIds?: unknown;
			batchComplete?: unknown;
		};
	} catch {
		return json({ error: translate(locals.locale, 'errors.api.invalidJson') }, { status: 400 });
	}

	const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
	const action = body.action;

	if (action === 'confirmAll') {
		const rawIds = body.itemIds;
		if (!Array.isArray(rawIds) || rawIds.length === 0) {
			return json({ error: translate(locals.locale, 'errors.api.invalidRequest') }, { status: 400 });
		}
		const itemIds = rawIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
		const confirmed = await locals.inventoryService.confirmStaleBatch(
			auth.householdId,
			itemIds,
			locals.householdRole!
		);
		for (const id of itemIds) {
			trackStalenessConfirmed(locals.pmfService, {
				userId: auth.user.id,
				householdId: auth.householdId,
				itemId: id
			});
		}
		return json({ ok: true, confirmed });
	}

	if (!itemId || (action !== 'confirm' && action !== 'finish')) {
		return json({ error: translate(locals.locale, 'errors.api.invalidRequest') }, { status: 400 });
	}

	try {
		if (action === 'confirm') {
			const item = await locals.inventoryService.confirmStillHave(
				auth.householdId,
				itemId,
				locals.householdRole!
			);
			trackStalenessConfirmed(locals.pmfService, {
				userId: auth.user.id,
				householdId: auth.householdId,
				itemId
			});
			return json({ ok: true, item: serializeItem(item) });
		}

		const result = await locals.inventoryService.markAsFinished(
			auth.householdId,
			itemId,
			auth.user.id,
			locals.householdRole!
		);
		trackInventoryWrite(locals.pmfService, {
			userId: auth.user.id,
			householdId: auth.householdId,
			action: 'consume',
			itemId
		});

		if (body.batchComplete === true) {
			trackBatchReviewCompleted(locals.pmfService, {
				userId: auth.user.id,
				householdId: auth.householdId,
				reviewedCount: 1
			});
		}

		return json({
			ok: true,
			item: serializeItem(result)
		});
	} catch (error) {
		if (error instanceof InventoryNotFoundError) {
			return json({ error: translate(locals.locale, 'errors.api.missingId') }, { status: 404 });
		}
		throw error;
	}
};
