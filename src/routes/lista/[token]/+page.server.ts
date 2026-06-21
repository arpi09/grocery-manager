import { error, redirect } from '@sveltejs/kit';
import { LISTA_JOIN_COOKIE } from '$lib/marketing/acquisition-attribution';
import { INKOP_PATH } from '$lib/navigation/app-home';
import { recordProductEvent } from '$lib/server/product-events';
import { shoppingListShareService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
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

		redirect(302, INKOP_PATH);
	}

	cookies?.set(LISTA_JOIN_COOKIE, params.token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7
	});

	return {
		preview,
		token: params.token
	};
};
