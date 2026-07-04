import { error, fail, redirect } from '@sveltejs/kit';
import { LISTA_JOIN_COOKIE } from '$lib/marketing/acquisition-attribution';
import { INKOP_PATH } from '$lib/navigation/app-home';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import { recordProductEvent } from '$lib/server/product-events';
import { shoppingListShareService } from '$lib/server/di';
import { isShoppingListShareEnabled } from '$lib/server/shopping-list-share-flag';
import type { Actions, PageServerLoad } from './$types';

/** Toggles per token — generous for a real shopping trip, tight enough to stop abuse. */
const GUEST_TOGGLE_MAX = 240;
const GUEST_TOGGLE_WINDOW_MS = 15 * 60_000;

export interface LiveShareItem {
	id: string;
	name: string;
	quantity: string | null;
	unit: string | null;
	checked: boolean;
}

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	if (!isShoppingListShareEnabled()) {
		error(404, 'Not found');
	}

	const preview = await shoppingListShareService.getSharePreview(params.token);
	if (!preview) {
		error(404, 'Not found');
	}

	if (locals?.user) {
		try {
			const targetHouseholdId = await shoppingListShareService.resolveHouseholdIdForToken(
				params.token
			);
			if (targetHouseholdId) {
				const outcome = await locals.householdService.joinSharedListHousehold(
					targetHouseholdId,
					locals.user.id
				);
				if (outcome === 'joined') {
					recordProductEvent(locals.pmfService, {
						userId: locals.user.id,
						householdId: targetHouseholdId,
						eventType: 'partner_joined',
						metadata: { context: 'lista' }
					});
				}
			}
		} catch (joinErr) {
			const message = joinErr instanceof Error ? joinErr.message : String(joinErr);
			console.warn(`[lista] logged-in join failed for token ${params.token}: ${message}`);
		}

		redirect(302, `${INKOP_PATH}?joined=1`);
	}

	cookies?.set(LISTA_JOIN_COOKIE, params.token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7
	});

	/* Live list for guest checkoff — degrades to the frozen snapshot if resolution fails. */
	let live: { items: LiveShareItem[] } | null = null;
	try {
		const householdId = await shoppingListShareService.resolveHouseholdIdForToken(params.token);
		if (householdId) {
			const items = await locals.shoppingListService.listItems(householdId);
			live = {
				items: items.map((item) => ({
					id: item.id,
					name: item.name,
					quantity: item.quantity,
					unit: item.unit,
					checked: item.checked
				}))
			};
		}
	} catch (liveErr) {
		const message = liveErr instanceof Error ? liveErr.message : String(liveErr);
		console.warn(`[lista] live list degraded for token ${params.token}: ${message}`);
	}

	return {
		preview,
		token: params.token,
		live
	};
};

export const actions: Actions = {
	toggle: async ({ params, request, locals }) => {
		if (!isShoppingListShareEnabled()) {
			error(404, 'Not found');
		}

		if (!consumeRateLimit(`lista-toggle:${params.token}`, GUEST_TOGGLE_MAX, GUEST_TOGGLE_WINDOW_MS)) {
			return fail(429, { code: 'rate_limited' });
		}

		const householdId = await shoppingListShareService.resolveHouseholdIdForToken(params.token);
		if (!householdId) {
			error(404, 'Not found');
		}

		const id = (await request.formData()).get('id');
		if (!id || typeof id !== 'string') {
			return fail(400, { code: 'missing_id' });
		}

		try {
			const updated = await locals.shoppingListService.toggleCheckedViaShare(householdId, id);

			recordProductEvent(locals.pmfService, {
				userId: locals.user?.id ?? null,
				householdId,
				eventType: 'shared_list_item_toggled',
				metadata: { checked: updated.checked, surface: 'lista' }
			});

			return { success: true, checked: updated.checked };
		} catch {
			return fail(404, { code: 'not_found' });
		}
	}
};
