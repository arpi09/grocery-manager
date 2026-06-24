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
	'guide_view',
	'public_report_viewed',
	'expiring_share_viewed',
	'shopping_list_share_viewed',
	'shopping_list_share_cta_clicked',
	'shared_list_opened',
	'shared_list_signup_clicked',
	'public_surface_viewed',
	'public_surface_signup_clicked',
	'public_city_feed_viewed',
	'public_city_feed_item_clicked',
	'public_city_feed_signup_clicked',
	'expiring_share_cta_clicked',
	'list_link_opened',
	'list_join_cta_clicked'
]);

const AUTH_EVENT_TYPES = new Set<ProductEventType>([
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'receipt_share_install_nudge_shown',
	'onboarding_skipped',
	'onboarding_quickstart',
	'onboarding_started',
	'onboarding_step_viewed',
	'onboarding_scan_started',
	'onboarding_scan_completed',
	'onboarding_inventory_created',
	'onboarding_brain_viewed',
	'onboarding_shopping_viewed',
	'onboarding_completed',
	'milestone_achieved',
	'celebration_shown',
	'streak_milestone_reached',
	'wrapped_viewed',
	'wrapped_shared',
	'expiring_share_created',
	'expiring_share_reported',
	'nearby_map_opened',
	'nearby_share_tapped',
	'shopping_list_export',
	'receipt_import_started',
	'receipt_uploaded',
	'receipt_review_completed',
	'receipt_import_success_viewed',
	'receipt_import_success_dismissed',
	'receipt_import_success_primary_cta',
	'receipt_import_success_secondary_cta',
	'activation_recipes_shown',
	'activation_recipe_clicked',
	'price_memory_viewed',
	'price_memory_search',
	'price_memory_product_opened',
	'price_memory_timeline_viewed',
	'price_memory_empty_state_seen',
	'brain_feedback_positive',
	'brain_feedback_negative',
	'brain_feedback_dismissed',
	'brain_explanation_viewed',
	'replenishment_suggestion_shown',
	'replenishment_suggestion_clicked',
	'pantry_health_insight_shown',
	'pantry_health_insight_clicked',
	'waste_alert_shown',
	'waste_alert_clicked',
	'waste_alert_resolved',
	'home_briefing_viewed',
	'home_briefing_opened',
	'for_you_cta_tapped',
	'moment_cta_tapped',
	'home_chip_tapped',
	'home_viewed',
	'recommendation_viewed',
	'recommendation_clicked',
	'expiring_clicked',
	'shopping_clicked',
	'pantry_clicked',
	'household_clicked',
	'primary_action_clicked',
	'replenishment_actioned',
	'waste_alert_actioned',
	'duplicate_warning_shown',
	'duplicate_warning_dismissed',
	'receipt_loop_cta_shown',
	'receipt_loop_cta_clicked',
	'shopping_list_share_created',
	'household_invite_prompt_shown',
	'household_invite_prompt_clicked',
	'household_invite_prompt_dismissed',
	'household_invite_created',
	'household_invite_sent',
	'household_invite_accepted',
	'shopping_list_share_clicked',
	'replenishment_fold_opened',
	'list_link_shared',
	'partner_joined',
	'shared_checkoff',
	'trip_started',
	'trip_item_checked',
	'trip_completed',
	'shopping_mode_switched',
	'memory_suggestion_added',
	'memory_suggestion_ignored',
	'pantry_shelf_opened',
	'pantry_zone_opened',
	'pantry_item_opened',
	'pantry_use_soon_tapped',
	'store_recommendation_opened',
	'store_preference_selected',
	'store_chain_selected',
	'store_compare_ica_enabled',
	'store_recommendation_interest_shown',
	'store_recommendation_completed',
	'planer_viewed',
	'ata_recipe_opened',
	'ata_week_view_toggled',
	'market_auto_listing_published',
	'market_auto_listing_cleared',
	'market_swish_link_opened'
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
