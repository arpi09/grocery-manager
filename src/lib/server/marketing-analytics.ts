import type { Cookies } from '@sveltejs/kit';
import type { PmfService } from '$lib/application/pmf.service';
import type { ProductEventType } from '$lib/domain/pmf';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import type { SignupUtm } from '$lib/domain/signup-utm';
import type { LandingHeroVariant, ReceiptHeroVariant } from '$lib/marketing/landing-variants';
import { signupUtmToEventMetadata } from '$lib/marketing/signup-utm';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { recordProductEvent } from '$lib/server/product-events';

const LANDING_VIEW_SESSION_COOKIE = 'hp_landing_view_sent';
const GUIDE_VIEW_SESSION_COOKIE_PREFIX = 'hp_guide_view_';

const LANDING_VIEW_SESSION_MAX_AGE = 60 * 30;
const GUIDE_VIEW_SESSION_MAX_AGE = 60 * 30;

export interface RecordMarketingEventOptions {
	pmfService: PmfService;
	cookies: Cookies;
	eventType: Extract<ProductEventType, 'landing_view' | 'register_click'>;
	variant: LandingHeroVariant;
	receiptHeroVariant?: ReceiptHeroVariant | null;
	userId?: string | null;
}

export function recordMarketingEvent(options: RecordMarketingEventOptions): void {
	if (!hasAnalyticsConsent(readCookieConsent(options.cookies))) {
		return;
	}

	const visitorId = getOrSetAnalyticsVisitorId(options.cookies);
	if (!visitorId) {
		return;
	}

	if (options.eventType === 'landing_view') {
		if (options.cookies.get(LANDING_VIEW_SESSION_COOKIE) === options.variant) {
			return;
		}
		options.cookies.set(LANDING_VIEW_SESSION_COOKIE, options.variant, {
			path: '/',
			maxAge: LANDING_VIEW_SESSION_MAX_AGE,
			httpOnly: true,
			sameSite: 'lax'
		});
	}

	recordProductEvent(options.pmfService, {
		userId: options.userId ?? null,
		householdId: null,
		eventType: options.eventType,
		metadata: {
			variant: options.variant,
			...(options.receiptHeroVariant ? { receiptHero: options.receiptHeroVariant } : {}),
			visitorId
		}
	});
}

export interface RecordSignupCompleteEventOptions {
	visitorId?: string | null;
	signupUtm?: SignupUtm | null;
}

export interface RecordGuideViewEventOptions {
	pmfService: PmfService;
	cookies: Cookies;
	slug: string;
	userId?: string | null;
}

export function recordGuideViewEvent(options: RecordGuideViewEventOptions): void {
	if (!hasAnalyticsConsent(readCookieConsent(options.cookies))) {
		return;
	}

	const visitorId = getOrSetAnalyticsVisitorId(options.cookies);
	if (!visitorId) {
		return;
	}

	const sessionCookie = `${GUIDE_VIEW_SESSION_COOKIE_PREFIX}${options.slug}`;
	if (options.cookies.get(sessionCookie) === '1') {
		return;
	}

	options.cookies.set(sessionCookie, '1', {
		path: '/',
		maxAge: GUIDE_VIEW_SESSION_MAX_AGE,
		httpOnly: true,
		sameSite: 'lax'
	});

	recordProductEvent(options.pmfService, {
		userId: options.userId ?? null,
		householdId: null,
		eventType: 'guide_view',
		metadata: {
			slug: options.slug,
			visitorId
		}
	});
}

const SIGNUP_FROM_WEDGE_EVENTS = {
	shopping_share: 'signup_from_shopping_share',
	expiring_share: 'signup_from_expiring_share'
} as const satisfies Record<string, ProductEventType>;

function resolveSignupFromWedgeEvent(
	signupUtm: SignupUtm | null | undefined
): ProductEventType | null {
	const content = signupUtm?.content?.trim();
	if (!content) {
		return null;
	}

	return SIGNUP_FROM_WEDGE_EVENTS[content as keyof typeof SIGNUP_FROM_WEDGE_EVENTS] ?? null;
}

export function recordSignupCompleteEvent(
	pmfService: PmfService,
	userId: string,
	variant: LandingHeroVariant,
	options?: RecordSignupCompleteEventOptions
): void {
	const utmMetadata = signupUtmToEventMetadata(options?.signupUtm);
	const baseMetadata = {
		variant,
		...(options?.visitorId ? { visitorId: options.visitorId } : {}),
		...utmMetadata
	};

	recordProductEvent(pmfService, {
		userId,
		householdId: null,
		eventType: 'signup_complete',
		metadata: baseMetadata
	});

	const wedgeEvent = resolveSignupFromWedgeEvent(options?.signupUtm);
	if (wedgeEvent) {
		recordProductEvent(pmfService, {
			userId,
			householdId: null,
			eventType: wedgeEvent,
			metadata: baseMetadata
		});
	}
}
