import { json } from '@sveltejs/kit';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import {
	isAnalyticsInteractionKind,
	normalizeAnalyticsRoute
} from '$lib/domain/analytics-behavior';
import { translate } from '$lib/i18n/messages';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';
import type { RequestHandler } from './$types';

const BEACON_RATE_MAX = 120;
const BEACON_RATE_WINDOW_MS = 60_000;
const MAX_BATCH_ITEMS = 50;

function clientIp(request: Request): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip')?.trim() ||
		'unknown'
	);
}

function parseTimestamp(value: unknown): Date | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return new Date(value);
	}
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (Number.isFinite(parsed)) {
			return new Date(parsed);
		}
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!hasAnalyticsConsent(readCookieConsent(cookies))) {
		return json({ ok: true, skipped: true });
	}

	const visitorId = getOrSetAnalyticsVisitorId(cookies);
	if (!visitorId) {
		return json({ ok: true, skipped: true });
	}

	const ip = clientIp(request);
	if (!consumeRateLimit(`analytics-beacon:${ip}`, BEACON_RATE_MAX, BEACON_RATE_WINDOW_MS)) {
		return json({ ok: false, error: translate(locals.locale, 'errors.api.rateLimited') }, { status: 429 });
	}

	let body: {
		pageViews?: unknown;
		interactions?: unknown;
	};
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidJson') },
			{ status: 400 }
		);
	}

	const pageViewsRaw = Array.isArray(body.pageViews) ? body.pageViews : [];
	const interactionsRaw = Array.isArray(body.interactions) ? body.interactions : [];
	if (pageViewsRaw.length + interactionsRaw.length > MAX_BATCH_ITEMS) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidPayload') },
			{ status: 400 }
		);
	}

	const pageViews = pageViewsRaw
		.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return null;
			}
			const row = entry as Record<string, unknown>;
			const route = typeof row.route === 'string' ? row.route : null;
			const clientId = typeof row.clientId === 'string' ? row.clientId.slice(0, 64) : null;
			const enteredAt = parseTimestamp(row.enteredAt);
			if (!route || !clientId || !enteredAt) {
				return null;
			}
			const exitedAt = parseTimestamp(row.exitedAt);
			const durationMs =
				typeof row.durationMs === 'number' && Number.isFinite(row.durationMs)
					? Math.max(0, Math.floor(row.durationMs))
					: undefined;
			const referrerRoute =
				typeof row.referrerRoute === 'string' ? normalizeAnalyticsRoute(row.referrerRoute) : undefined;
			return {
				clientId,
				route,
				enteredAt,
				exitedAt: exitedAt ?? undefined,
				durationMs,
				referrerRoute
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

	const interactions = interactionsRaw
		.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return null;
			}
			const row = entry as Record<string, unknown>;
			const route = typeof row.route === 'string' ? row.route : null;
			const elementKey = typeof row.elementKey === 'string' ? row.elementKey : null;
			const kind = row.kind;
			const createdAt = parseTimestamp(row.createdAt);
			if (!route || !elementKey || !createdAt || !isAnalyticsInteractionKind(kind)) {
				return null;
			}
			const value =
				typeof row.value === 'number' && Number.isFinite(row.value)
					? Math.floor(row.value)
					: undefined;
			return {
				route,
				elementKey,
				kind,
				value,
				createdAt
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

	await locals.analyticsBehaviorService.ingestBeacon(
		{
			visitorId,
			userId: locals.user?.id ?? null,
			householdId: locals.householdId,
			userAgent: request.headers.get('user-agent')
		},
		{ pageViews, interactions }
	);

	return json({ ok: true });
};
