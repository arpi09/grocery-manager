import { json } from '@sveltejs/kit';
import { ERROR_LOG_ADMIN_LIST_MAX } from '$lib/domain/error-log';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { errorLogRepository } from '$lib/server/di';
import type { RequestHandler } from './$types';

const MAX_HOURS = 168;
const DEFAULT_HOURS = 24;
const DEFAULT_LIMIT = 25;

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 1) return fallback;
	return Math.min(parsed, max);
}

export const GET: RequestHandler = async ({ request, url }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const hours = parsePositiveInt(url.searchParams.get('hours'), DEFAULT_HOURS, MAX_HOURS);
	const limit = parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT, ERROR_LOG_ADMIN_LIST_MAX);
	const since = new Date(Date.now() - hours * 60 * 60 * 1000);

	const errors = await errorLogRepository.listFullSince(since, limit);

	return json({
		ok: true,
		since: since.toISOString(),
		count: errors.length,
		errors: errors.map((entry) => ({
			id: entry.id,
			message: entry.message,
			path: entry.path,
			statusCode: entry.statusCode,
			createdAt: entry.createdAt.toISOString(),
			hasStack: entry.stack !== null,
			stack: entry.stack
		})),
		prodHint: {
			note: 'compare createdAt with last deploy SHA'
		}
	});
};
