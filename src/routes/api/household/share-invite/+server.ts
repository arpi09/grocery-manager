import { json } from '@sveltejs/kit';
import { HouseholdForbiddenError } from '$lib/application/household.service';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { getAppOrigin } from '$lib/server/origin';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as { context?: string };
	const context = typeof body.context === 'string' ? body.context : 'inkop';

	try {
		const { token } = await locals.householdService.createShareInvite(
			auth.householdId,
			auth.user.id,
			'editor'
		);
		const inviteUrl = `${getAppOrigin(url.origin)}/invite/${token}`;

		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: auth.householdId,
			eventType: 'household_invite_created',
			metadata: { context }
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
