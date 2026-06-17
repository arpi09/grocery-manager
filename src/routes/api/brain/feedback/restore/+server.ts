import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { isBrainFeedbackV1Enabled } from '$lib/server/brain-feedback-flag';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { purchasePatternRepository } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isBrainFeedbackV1Enabled()) {
		return json({ error: 'Feature disabled' }, { status: 404 });
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as { normalizedKey?: string } | null;
	const normalizedKey = body?.normalizedKey?.trim();
	if (!normalizedKey) {
		return json({ error: 'Missing normalizedKey' }, { status: 400 });
	}

	await purchasePatternRepository.restoreDismissal(auth.householdId, normalizedKey);
	return json({ ok: true });
};
