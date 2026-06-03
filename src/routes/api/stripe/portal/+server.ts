import { json } from '@sveltejs/kit';
import {
	BillingHouseholdMissingError,
	BillingNotConfiguredError,
	BillingPortalUnavailableError
} from '$lib/application/billing.service';
import { isHouseholdOwner } from '$lib/domain/household';
import { translate } from '$lib/i18n/messages';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (!locals.householdId || !locals.householdRole || !isHouseholdOwner(locals.householdRole)) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.billing.ownerRequired') },
			{ status: 403 }
		);
	}

	try {
		const session = await locals.billingService.createPortalSession({
			householdId: locals.householdId,
			origin: url.origin
		});
		return json({ ok: true, url: session.url });
	} catch (error) {
		if (error instanceof BillingNotConfiguredError) {
			return json(
				{ ok: false, error: translate(locals.locale, 'errors.billing.notConfigured') },
				{ status: 503 }
			);
		}
		if (error instanceof BillingPortalUnavailableError) {
			return json(
				{ ok: false, error: translate(locals.locale, 'errors.billing.portalUnavailable') },
				{ status: 409 }
			);
		}
		if (error instanceof BillingHouseholdMissingError) {
			return json({ ok: false, error: 'Household not found' }, { status: 404 });
		}
		throw error;
	}
};
