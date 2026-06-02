import { json } from '@sveltejs/kit';
import {
	BillingHouseholdMissingError,
	BillingNotConfiguredError
} from '$lib/application/billing.service';
import { isHouseholdOwner } from '$lib/domain/household';
import { isProTier } from '$lib/domain/plan';
import { translate } from '$lib/i18n/messages';
import { createCheckoutSessionSchema } from '$lib/validation/billing.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
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

	const planTier = locals.planTier ?? (await locals.billingService.getPlanTier(locals.householdId));
	if (isProTier(planTier)) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.billing.alreadyPro') },
			{ status: 409 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = createCheckoutSessionSchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Invalid interval' }, { status: 400 });
	}

	try {
		const session = await locals.billingService.createCheckoutSession({
			householdId: locals.householdId,
			userId: user.id,
			userEmail: user.email,
			interval: parsed.data.interval,
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
		if (error instanceof BillingHouseholdMissingError) {
			return json({ ok: false, error: 'Household not found' }, { status: 404 });
		}
		throw error;
	}
};
