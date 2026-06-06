import { json } from '@sveltejs/kit';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { translate } from '$lib/i18n/messages';
import { requireUser } from '$lib/server/api-guards';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import { PRODUCT_EVENT_TYPES, type ProductEventType } from '$lib/domain/pmf';
import {
	isLandingHeroVariant,
	LANDING_VARIANT_COOKIE,
	type LandingHeroVariant
} from '$lib/marketing/landing-variants';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

const PUBLIC_EVENT_TYPES = new Set<ProductEventType>([
	'register_click',
	'landing_view',
	'public_report_viewed',
	'expiring_share_viewed'
]);

const AUTH_EVENT_TYPES = new Set<ProductEventType>([
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'onboarding_skipped',
	'onboarding_quickstart',
	'onboarding_completed',
	'milestone_achieved',
	'celebration_shown',
	'streak_milestone_reached',
	'wrapped_viewed',
	'wrapped_shared',
	'expiring_share_created'
]);

function isAllowedEventType(value: unknown): value is ProductEventType {
	return typeof value === 'string' && (PRODUCT_EVENT_TYPES as readonly string[]).includes(value);
}

function resolveVariant(
	bodyVariant: unknown,
	cookieVariant: string | undefined,
	allowVariantCookie: boolean
): LandingHeroVariant {
	if (typeof bodyVariant === 'string' && isLandingHeroVariant(bodyVariant)) {
		return bodyVariant;
	}
	if (allowVariantCookie && isLandingHeroVariant(cookieVariant)) {
		return cookieVariant;
	}
	return 'a';
}

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	let body: { eventType?: unknown; metadata?: unknown };
	try {
		body = (await request.json()) as { eventType?: unknown; metadata?: unknown };
	} catch {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidJson') },
			{ status: 400 }
		);
	}

	if (!isAllowedEventType(body.eventType)) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidEventType') },
			{ status: 400 }
		);
	}

	const eventType = body.eventType;
	const isPublic = PUBLIC_EVENT_TYPES.has(eventType);
	const isAuthEvent = AUTH_EVENT_TYPES.has(eventType);

	if (!isPublic && !isAuthEvent) {
		return json(
			{ ok: false, error: translate(locals.locale, 'errors.api.invalidEventType') },
			{ status: 400 }
		);
	}

	if (isAuthEvent) {
		const auth = requireUser(locals);
		if (!auth.authorized) {
			return auth.response;
		}
	}

	const consent = readCookieConsent(cookies);
	const analyticsAllowed = hasAnalyticsConsent(consent);

	if (isPublic && !locals.user && !analyticsAllowed) {
		return json({ ok: true, skipped: true });
	}

	const allowVariantCookie = analyticsAllowed;
	const visitorId = getOrSetAnalyticsVisitorId(cookies);
	const metadata =
		body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
			? (body.metadata as Record<string, unknown>)
			: {};

	if (eventType === 'register_click') {
		metadata.variant = resolveVariant(
			metadata.variant,
			cookies.get(LANDING_VARIANT_COOKIE),
			allowVariantCookie
		);
	}

	recordProductEvent(locals.pmfService, {
		userId: locals.user?.id ?? null,
		householdId: locals.householdId,
		eventType,
		metadata: {
			...metadata,
			...(visitorId ? { visitorId } : {})
		}
	});

	return json({ ok: true });
};
