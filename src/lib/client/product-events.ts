import { hasClientAnalyticsConsent } from '$lib/client/cookie-consent';

const CLIENT_EVENT_TYPES = [
	'register_click',
	'onboarding_skipped',
	'onboarding_quickstart',
	'onboarding_started',
	'onboarding_step_viewed',
	'onboarding_scan_started',
	'onboarding_scan_completed',
	'onboarding_inventory_created',
	'onboarding_brain_viewed',
	'onboarding_shopping_viewed',
	'onboarding_notifications_prompted',
	'onboarding_kivra_tapped',
	'onboarding_completed',
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'receipt_share_install_nudge_shown',
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
	'shopping_list_share_clicked',
	'replenishment_fold_opened',
	'brain_feedback_positive',
	'brain_feedback_negative',
	'brain_feedback_dismissed',
	'brain_explanation_viewed',
	'list_link_shared',
	'list_link_opened',
	'list_join_cta_clicked',
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
	'ata_week_view_toggled'
] as const;

export const PUBLIC_ACQUISITION_EVENT_TYPES = [
	'shopping_list_share_viewed',
	'shopping_list_share_cta_clicked',
	'shared_list_opened',
	'shared_list_signup_clicked',
	'public_surface_viewed',
	'public_surface_signup_clicked',
	'public_city_feed_viewed',
	'public_city_feed_item_clicked',
	'public_city_feed_signup_clicked',
	'expiring_share_viewed',
	'expiring_share_cta_clicked'
] as const;

export type ClientProductEventType = (typeof CLIENT_EVENT_TYPES)[number];
export type PublicAcquisitionEventType = (typeof PUBLIC_ACQUISITION_EVENT_TYPES)[number];

export interface TrackProductEventOptions {
	eventType: ClientProductEventType;
	metadata?: Record<string, unknown>;
}

export interface TrackPublicAcquisitionEventOptions {
	eventType: PublicAcquisitionEventType;
	metadata?: Record<string, unknown>;
}

const PUBLIC_CLIENT_EVENTS = new Set<ClientProductEventType>(['register_click']);

async function postProductEvent(
	eventType: string,
	metadata?: Record<string, unknown>
): Promise<void> {
	try {
		await fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ eventType, metadata })
		});
	} catch {
		// Best-effort analytics — never block UX
	}
}

export async function trackProductEvent(
	eventType: ClientProductEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
	if (PUBLIC_CLIENT_EVENTS.has(eventType) && !hasClientAnalyticsConsent()) {
		return;
	}

	await postProductEvent(eventType, metadata);
}

export async function trackPublicAcquisitionEvent(
	eventType: PublicAcquisitionEventType,
	metadata?: Record<string, unknown>
): Promise<void> {
	if (!hasClientAnalyticsConsent()) {
		return;
	}

	await postProductEvent(eventType, metadata);
}

export function isClientProductEventType(value: string): value is ClientProductEventType {
	return (CLIENT_EVENT_TYPES as readonly string[]).includes(value);
}

export function isPublicAcquisitionEventType(value: string): value is PublicAcquisitionEventType {
	return (PUBLIC_ACQUISITION_EVENT_TYPES as readonly string[]).includes(value);
}
