import type { Cookies } from '@sveltejs/kit';
import type { PmfService } from '$lib/application/pmf.service';
import type { ProductEventType } from '$lib/domain/pmf';
import { hasAnalyticsConsent } from '$lib/cookie-consent';
import { readCookieConsent } from '$lib/infrastructure/cookie-consent-cookie';
import type { SignupUtm } from '$lib/domain/signup-utm';
import type { LandingHeroVariant } from '$lib/marketing/landing-variants';
import { signupUtmToEventMetadata } from '$lib/marketing/signup-utm';
import { getOrSetAnalyticsVisitorId } from '$lib/server/analytics-visitor';
import { recordProductEvent } from '$lib/server/product-events';

const LANDING_VIEW_SESSION_COOKIE = 'hp_landing_view_sent';

const LANDING_VIEW_SESSION_MAX_AGE = 60 * 30;

export interface RecordMarketingEventOptions {
	pmfService: PmfService;
	cookies: Cookies;
	eventType: Extract<ProductEventType, 'landing_view' | 'register_click'>;
	variant: LandingHeroVariant;
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
			visitorId
		}
	});
}

export interface RecordSignupCompleteEventOptions {
	visitorId?: string | null;
	signupUtm?: SignupUtm | null;
}

export function recordSignupCompleteEvent(
	pmfService: PmfService,
	userId: string,
	variant: LandingHeroVariant,
	options?: RecordSignupCompleteEventOptions
): void {
	recordProductEvent(pmfService, {
		userId,
		householdId: null,
		eventType: 'signup_complete',
		metadata: {
			variant,
			...(options?.visitorId ? { visitorId: options.visitorId } : {}),
			...signupUtmToEventMetadata(options?.signupUtm)
		}
	});
}
