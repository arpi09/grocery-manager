import { json } from '@sveltejs/kit';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { skaffurapportService } from '$lib/server/di';
import type { RequestHandler } from './$types';

function previousReportMonth(reference = new Date()): string {
	const year = reference.getUTCFullYear();
	const month = reference.getUTCMonth();
	const target = month === 0 ? new Date(Date.UTC(year - 1, 11, 1)) : new Date(Date.UTC(year, month - 1, 1));
	return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const month = previousReportMonth();
	const snapshot = await skaffurapportService.aggregateMonth(month);
	return json({
		ok: true,
		month,
		published: snapshot?.meetsKAnonymity ?? false,
		householdCount: snapshot?.householdCount ?? 0,
		eventCount: snapshot?.eventCount ?? 0
	});
};
