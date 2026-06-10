import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { expiringShareService } from '$lib/server/di';
import { recordProductEvent } from '$lib/server/product-events';
import { notifyOwnerExpiringShareReport } from '$lib/server/share-report-notify';
import { expiringShareReportSchema } from '$lib/validation/nearby-sharing.schemas';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = await request.json().catch(() => null);
	const parsed = expiringShareReportSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidJson') },
			{ status: 400 }
		);
	}

	const result = await expiringShareService.reportShare(auth.user.id, parsed.data);
	if (!result.ok) {
		return json(
			{ ok: false, error: translate(locals.locale, 'nearbySharing.reportNotFound') },
			{ status: 404 }
		);
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'expiring_share_reported',
		metadata: {
			shareId: result.shareId,
			blockHousehold: parsed.data.blockHousehold === true,
			reason: parsed.data.reason ?? null
		}
	});

	void notifyOwnerExpiringShareReport({
		shareId: result.shareId,
		householdId: result.householdId,
		reporterUserId: auth.user.id,
		reason: parsed.data.reason ?? null
	});

	return json({ ok: true });
};
