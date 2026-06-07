import { json } from '@sveltejs/kit';
import { ERROR_LOG_MESSAGE_MAX_LENGTH } from '$lib/domain/error-log';
import { recordAppError } from '$lib/server/error-log/record';
import { sanitizeErrorMessage, truncateForLog } from '$lib/server/error-log/sanitize';
import type { RequestHandler } from './$types';

const MAX_URL_LENGTH = 500;
const MAX_STACK_LENGTH = 8_000;

function parseUrl(value: unknown): string {
	if (typeof value !== 'string') {
		return 'CLIENT unknown';
	}
	const trimmed = value.trim();
	if (!trimmed) {
		return 'CLIENT unknown';
	}
	return truncateForLog(`CLIENT ${trimmed}`, MAX_URL_LENGTH);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: { message?: unknown; stack?: unknown; url?: unknown; statusCode?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
	if (!rawMessage) {
		return json({ ok: false }, { status: 400 });
	}

	const message = truncateForLog(
		sanitizeErrorMessage(rawMessage),
		ERROR_LOG_MESSAGE_MAX_LENGTH
	);
	const stack =
		typeof body.stack === 'string' && body.stack.trim()
			? truncateForLog(body.stack.trim(), MAX_STACK_LENGTH)
			: null;
	const path = parseUrl(body.url);
	const statusCode =
		typeof body.statusCode === 'number' && body.statusCode >= 400 && body.statusCode <= 599
			? body.statusCode
			: 500;

	await recordAppError({
		message,
		stack,
		path,
		userId: locals.user?.id ?? null,
		statusCode
	});

	return json({ ok: true });
};
