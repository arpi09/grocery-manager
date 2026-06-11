import { json } from '@sveltejs/kit';
import { HouseholdForbiddenError } from '$lib/application/household.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { getAppOrigin } from '$lib/server/origin';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		const { token } = await locals.householdService.createShareInvite(
			auth.householdId,
			auth.user.id,
			'viewer'
		);
		const inviteUrl = `${getAppOrigin(url.origin)}/invite/${token}`;

		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: auth.householdId,
			eventType: 'household_invite_created',
			metadata: { context: 'inkop' }
		});

		return json({ ok: true, inviteUrl });
	} catch (error) {
		if (error instanceof HouseholdForbiddenError) {
			return json(
				{ ok: false, error: translate(locals.locale, 'errors.household.forbidden') },
				{ status: 403 }
			);
		}
		throw error;
	}
};
