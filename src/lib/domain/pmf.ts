export const PRODUCT_EVENT_TYPES = [
	'scan_completed',
	'receipt_import_started',
	'receipt_uploaded',
	'receipt_parsed',
	'receipt_review_completed',
	'receipt_import_success_viewed',
	'receipt_import_success_dismissed',
	'receipt_import_success_primary_cta',
	'receipt_import_success_secondary_cta',
	'photo_round_parsed',
	'fill_suggestions_added',
	'landing_view',
	'guide_view',
	'register_click',
	'signup_complete',
	'signup_from_shopping_share',
	'signup_from_expiring_share',
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
	'first_scan',
	'pwa_banner_dismiss',
	'pwa_banner_install_click',
	'receipt_autopilot_accepted',
	'weekly_ritual_approved',
	'eat_first_week_viewed',
	'eat_first_plan_applied',
	'milestone_achieved',
	'celebration_shown',
	'streak_milestone_reached',
	'public_report_viewed',
	'expiring_share_created',
	'expiring_share_viewed',
	'expiring_share_cta_clicked',
	'shopping_list_share_created',
	'shopping_list_share_viewed',
	'shopping_list_share_cta_clicked',
	'public_city_feed_viewed',
	'public_city_feed_item_clicked',
	'public_city_feed_signup_clicked',
	'household_invite_prompt_shown',
	'household_invite_prompt_clicked',
	'household_invite_prompt_dismissed',
	'household_invite_created',
	'household_invite_accepted',
	'shopping_list_share_clicked',
	'replenishment_fold_opened',
	'nearby_map_opened',
	'nearby_share_tapped',
	'expiring_share_reported',
	'wrapped_viewed',
	'wrapped_shared',
	'kivra_forward_received',
	'shopping_list_export',
	'barcode_override_used',
	'inventory_write',
	'batch_review_completed',
	'one_tap_consume',
	'staleness_confirmed',
	'shopping_checkoff_to_pantry',
	'receipt_finish_accepted',
	'price_memory_viewed',
	'price_memory_search',
	'price_memory_product_opened',
	'price_memory_timeline_viewed',
	'price_memory_empty_state_seen',
	'replenishment_suggestion_shown',
	'replenishment_suggestion_clicked',
	'replenishment_suggestion_added',
	'replenishment_suggestion_accepted',
	'replenishment_suggestion_dismissed',
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
	'list_link_shared',
	'list_link_opened',
	'list_join_cta_clicked',
	'partner_joined',
	'shared_checkoff',
	'brain_feedback_positive',
	'brain_feedback_negative',
	'brain_feedback_dismissed',
	'brain_explanation_viewed',
	'memory_rule_created',
	'memory_rule_updated',
	'memory_rule_rejected',
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
	'store_recommendation_completed'
] as const;

export const PMF_PRODUCT_EVENT_TYPES = [
	'scan_completed',
	'receipt_import_started',
	'receipt_uploaded',
	'receipt_parsed',
	'receipt_review_completed',
	'photo_round_parsed',
	'fill_suggestions_added'
] as const;

export type PmfProductEventType = (typeof PMF_PRODUCT_EVENT_TYPES)[number];

export type ProductEventType = (typeof PRODUCT_EVENT_TYPES)[number];

export const SCAN_EVENT_TYPES: ProductEventType[] = [
	'scan_completed',
	'receipt_parsed',
	'photo_round_parsed'
];

export const ACTIVATION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ACTIVATION_ITEM_THRESHOLD = 10;
export const WAU_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MAU_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const PMF_TARGETS = {
	activationRate: 0.4,
	medianTimeToFirstScanMinutes: 3,
	weeklyScanRate: 0.3,
	d7Retention: 0.2,
	d30RetentionEarly: 0.15,
	d30RetentionMature: 0.25,
	multiMemberHouseholdRate: 0.5,
	smartFillWeeklyRate: 0.2,
	weeklyRitualRate: 0.15,
	wrappedRate: 0.2,
	receiptRate: 0.25,
	inviteRate: 0.3
} as const;

export interface UserRegistrationRow {
	id: string;
	createdAt: Date;
	lastSeenAt: Date | null;
}

export interface UserActivationFacts {
	userId: string;
	registeredAt: Date;
	itemCountWithin24h: number;
	receiptParsedWithin24h: boolean;
}

export interface FirstScanFacts {
	userId: string;
	registeredAt: Date;
	firstScanAt: Date | null;
}

export interface HouseholdMemberActivity {
	householdId: string;
	userId: string;
	lastSeenAt: Date | null;
}

export interface PmfMetricSnapshot {
	activationRate: number;
	activatedUsers: number;
	eligibleUsers: number;
	medianTimeToFirstScanMinutes: number | null;
	weeklyScanRate: number;
	wauCount: number;
	weeklyScanners: number;
	d7Retention: number;
	d7EligibleUsers: number;
	d30Retention: number;
	d30EligibleUsers: number;
	multiMemberHouseholdRate: number;
	activeHouseholds: number;
	multiMemberActiveHouseholds: number;
	smartFillWeeklyRate: number;
	weeklyFillUsers: number;
	weeklyRitualRate: number;
	weeklyRitualUsers: number;
	wrappedRate: number;
	mauCount: number;
	wrappedViewers: number;
	receiptRate: number;
	receiptUsers: number;
	inviteRate: number;
	newHouseholds: number;
	multiMemberNewHouseholds: number;
	eventCounts: Record<PmfProductEventType, number>;
}

export const PMF_TRACKED_METRIC_KEYS = [
	'activationRate',
	'medianTimeToFirstScanMinutes',
	'weeklyScanRate',
	'd7Retention',
	'd30Retention',
	'multiMemberHouseholdRate',
	'smartFillWeeklyRate',
	'weeklyRitualRate',
	'wrappedRate',
	'receiptRate',
	'inviteRate'
] as const;

export type PmfTrackedMetricKey = (typeof PMF_TRACKED_METRIC_KEYS)[number];

export type PmfMetricDeltaDirection = 'up' | 'down' | 'flat' | 'unknown';

export interface PmfMetricStatus {
	key: PmfTrackedMetricKey;
	current: number | null;
	previous: number | null;
	delta: number | null;
	deltaDirection: PmfMetricDeltaDirection;
	onTarget: boolean;
	target: number;
	higherIsBetter: boolean;
}

export interface PmfWeeklyReview {
	currentWeekEnd: Date;
	previousWeekEnd: Date;
	current: PmfMetricSnapshot;
	previous: PmfMetricSnapshot;
	metrics: PmfMetricStatus[];
	belowTarget: PmfMetricStatus[];
	onTargetCount: number;
	totalTracked: number;
}

const PMF_METRIC_CONFIG: Record<
	PmfTrackedMetricKey,
	{ target: number; higherIsBetter: boolean }
> = {
	activationRate: { target: PMF_TARGETS.activationRate, higherIsBetter: true },
	medianTimeToFirstScanMinutes: {
		target: PMF_TARGETS.medianTimeToFirstScanMinutes,
		higherIsBetter: false
	},
	weeklyScanRate: { target: PMF_TARGETS.weeklyScanRate, higherIsBetter: true },
	d7Retention: { target: PMF_TARGETS.d7Retention, higherIsBetter: true },
	d30Retention: { target: PMF_TARGETS.d30RetentionEarly, higherIsBetter: true },
	multiMemberHouseholdRate: {
		target: PMF_TARGETS.multiMemberHouseholdRate,
		higherIsBetter: true
	},
	smartFillWeeklyRate: { target: PMF_TARGETS.smartFillWeeklyRate, higherIsBetter: true },
	weeklyRitualRate: { target: PMF_TARGETS.weeklyRitualRate, higherIsBetter: true },
	wrappedRate: { target: PMF_TARGETS.wrappedRate, higherIsBetter: true },
	receiptRate: { target: PMF_TARGETS.receiptRate, higherIsBetter: true },
	inviteRate: { target: PMF_TARGETS.inviteRate, higherIsBetter: true }
};

const RATE_DELTA_EPSILON = 0.001;
const MINUTES_DELTA_EPSILON = 0.1;

export function getTrackedMetricValue(
	snapshot: PmfMetricSnapshot,
	key: PmfTrackedMetricKey
): number | null {
	return snapshot[key];
}

export function isTrackedMetricOnTarget(
	key: PmfTrackedMetricKey,
	value: number | null
): boolean {
	if (value === null) {
		return false;
	}

	const { target, higherIsBetter } = PMF_METRIC_CONFIG[key];
	return higherIsBetter ? value >= target : value <= target;
}

export function computeMetricDelta(
	key: PmfTrackedMetricKey,
	current: number | null,
	previous: number | null
): Pick<PmfMetricStatus, 'delta' | 'deltaDirection'> {
	const { higherIsBetter } = PMF_METRIC_CONFIG[key];

	if (current === null || previous === null) {
		return { delta: null, deltaDirection: 'unknown' };
	}

	const rawDelta = current - previous;
	const improvementDelta = higherIsBetter ? rawDelta : -rawDelta;
	const epsilon = key === 'medianTimeToFirstScanMinutes' ? MINUTES_DELTA_EPSILON : RATE_DELTA_EPSILON;

	if (Math.abs(improvementDelta) < epsilon) {
		return { delta: rawDelta, deltaDirection: 'flat' };
	}

	return {
		delta: rawDelta,
		deltaDirection: improvementDelta > 0 ? 'up' : 'down'
	};
}

export function buildMetricStatus(
	key: PmfTrackedMetricKey,
	current: PmfMetricSnapshot,
	previous: PmfMetricSnapshot
): PmfMetricStatus {
	const currentValue = getTrackedMetricValue(current, key);
	const previousValue = getTrackedMetricValue(previous, key);
	const { target, higherIsBetter } = PMF_METRIC_CONFIG[key];
	const { delta, deltaDirection } = computeMetricDelta(key, currentValue, previousValue);

	return {
		key,
		current: currentValue,
		previous: previousValue,
		delta,
		deltaDirection,
		onTarget: isTrackedMetricOnTarget(key, currentValue),
		target,
		higherIsBetter
	};
}

export function buildWeeklyReview(
	current: PmfMetricSnapshot,
	previous: PmfMetricSnapshot,
	currentWeekEnd: Date,
	previousWeekEnd: Date
): PmfWeeklyReview {
	const metrics = PMF_TRACKED_METRIC_KEYS.map((key) =>
		buildMetricStatus(key, current, previous)
	);
	const belowTarget = metrics.filter((metric) => !metric.onTarget);
	const onTargetCount = metrics.length - belowTarget.length;

	return {
		currentWeekEnd,
		previousWeekEnd,
		current,
		previous,
		metrics,
		belowTarget,
		onTargetCount,
		totalTracked: metrics.length
	};
}

export function isScanEventType(eventType: ProductEventType): boolean {
	return SCAN_EVENT_TYPES.includes(eventType);
}

export function isUserActivated(facts: UserActivationFacts): boolean {
	return (
		facts.itemCountWithin24h >= ACTIVATION_ITEM_THRESHOLD || facts.receiptParsedWithin24h
	);
}

export function computeActivationRate(facts: UserActivationFacts[]): {
	rate: number;
	activatedUsers: number;
	eligibleUsers: number;
} {
	const eligibleUsers = facts.length;
	if (eligibleUsers === 0) {
		return { rate: 0, activatedUsers: 0, eligibleUsers: 0 };
	}

	const activatedUsers = facts.filter(isUserActivated).length;
	return {
		rate: activatedUsers / eligibleUsers,
		activatedUsers,
		eligibleUsers
	};
}

function dateMs(value: Date | string): number {
	return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function medianMinutesToFirstScan(facts: FirstScanFacts[]): number | null {
	const deltas = facts
		.filter((row) => row.firstScanAt !== null)
		.map((row) => (dateMs(row.firstScanAt!) - dateMs(row.registeredAt)) / 60_000)
		.filter((minutes) => minutes >= 0)
		.sort((a, b) => a - b);

	if (deltas.length === 0) {
		return null;
	}

	const mid = Math.floor(deltas.length / 2);
	if (deltas.length % 2 === 0) {
		return (deltas[mid - 1]! + deltas[mid]!) / 2;
	}

	return deltas[mid]!;
}

export function isWeeklyActive(lastSeenAt: Date | null, now: Date, windowMs = WAU_WINDOW_MS): boolean {
	if (!lastSeenAt) {
		return false;
	}

	return dateMs(lastSeenAt) >= now.getTime() - windowMs;
}

export function computeWeeklyScanRate(
	wauUserIds: Set<string>,
	weeklyScannerUserIds: Set<string>
): { rate: number; wauCount: number; weeklyScanners: number } {
	const wauCount = wauUserIds.size;
	if (wauCount === 0) {
		return { rate: 0, wauCount: 0, weeklyScanners: 0 };
	}

	let weeklyScanners = 0;
	for (const userId of weeklyScannerUserIds) {
		if (wauUserIds.has(userId)) {
			weeklyScanners++;
		}
	}

	return {
		rate: weeklyScanners / wauCount,
		wauCount,
		weeklyScanners
	};
}

export function computeRetentionRate(
	users: UserRegistrationRow[],
	retentionDays: number,
	now = new Date()
): { rate: number; eligibleUsers: number } {
	const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
	const eligible = users.filter(
		(user) => now.getTime() - dateMs(user.createdAt) >= retentionMs
	);

	if (eligible.length === 0) {
		return { rate: 0, eligibleUsers: 0 };
	}

	const retained = eligible.filter((user) => {
		if (!user.lastSeenAt) {
			return false;
		}

		return dateMs(user.lastSeenAt) - dateMs(user.createdAt) >= retentionMs;
	});

	return {
		rate: retained.length / eligible.length,
		eligibleUsers: eligible.length
	};
}

export function computeMultiMemberHouseholdRate(
	members: HouseholdMemberActivity[],
	now = new Date(),
	windowMs = WAU_WINDOW_MS
): { rate: number; activeHouseholds: number; multiMemberActiveHouseholds: number } {
	const activeMembersByHousehold = new Map<string, Set<string>>();

	for (const member of members) {
		if (!isWeeklyActive(member.lastSeenAt, now, windowMs)) {
			continue;
		}

		const set = activeMembersByHousehold.get(member.householdId) ?? new Set<string>();
		set.add(member.userId);
		activeMembersByHousehold.set(member.householdId, set);
	}

	const activeHouseholds = activeMembersByHousehold.size;
	if (activeHouseholds === 0) {
		return { rate: 0, activeHouseholds: 0, multiMemberActiveHouseholds: 0 };
	}

	let multiMemberActiveHouseholds = 0;
	for (const memberIds of activeMembersByHousehold.values()) {
		if (memberIds.size >= 2) {
			multiMemberActiveHouseholds++;
		}
	}

	return {
		rate: multiMemberActiveHouseholds / activeHouseholds,
		activeHouseholds,
		multiMemberActiveHouseholds
	};
}

export function computeSmartFillWeeklyRate(
	wauUserIds: Set<string>,
	weeklyFillUserIds: Set<string>
): { rate: number; weeklyFillUsers: number } {
	if (wauUserIds.size === 0) {
		return { rate: 0, weeklyFillUsers: 0 };
	}

	let weeklyFillUsers = 0;
	for (const userId of weeklyFillUserIds) {
		if (wauUserIds.has(userId)) {
			weeklyFillUsers++;
		}
	}

	return {
		rate: weeklyFillUsers / wauUserIds.size,
		weeklyFillUsers
	};
}

export function isMonthlyActive(lastSeenAt: Date | null, now: Date, windowMs = MAU_WINDOW_MS): boolean {
	return isWeeklyActive(lastSeenAt, now, windowMs);
}

export function computeWeeklyRitualRate(
	wauUserIds: Set<string>,
	weeklyRitualUserIds: Set<string>
): { rate: number; weeklyRitualUsers: number } {
	if (wauUserIds.size === 0) {
		return { rate: 0, weeklyRitualUsers: 0 };
	}

	let weeklyRitualUsers = 0;
	for (const userId of weeklyRitualUserIds) {
		if (wauUserIds.has(userId)) {
			weeklyRitualUsers++;
		}
	}

	return {
		rate: weeklyRitualUsers / wauUserIds.size,
		weeklyRitualUsers
	};
}

export function computeWrappedRate(
	mauUserIds: Set<string>,
	wrappedViewerUserIds: Set<string>
): { rate: number; mauCount: number; wrappedViewers: number } {
	const mauCount = mauUserIds.size;
	if (mauCount === 0) {
		return { rate: 0, mauCount: 0, wrappedViewers: 0 };
	}

	let wrappedViewers = 0;
	for (const userId of wrappedViewerUserIds) {
		if (mauUserIds.has(userId)) {
			wrappedViewers++;
		}
	}

	return {
		rate: wrappedViewers / mauCount,
		mauCount,
		wrappedViewers
	};
}

export function computeReceiptRate(
	activatedUserIds: Set<string>,
	receiptUserIds: Set<string>
): { rate: number; receiptUsers: number } {
	if (activatedUserIds.size === 0) {
		return { rate: 0, receiptUsers: 0 };
	}

	let receiptUsers = 0;
	for (const userId of receiptUserIds) {
		if (activatedUserIds.has(userId)) {
			receiptUsers++;
		}
	}

	return {
		rate: receiptUsers / activatedUserIds.size,
		receiptUsers
	};
}

export function computeInviteRate(
	newHouseholdMemberCounts: number[]
): { rate: number; newHouseholds: number; multiMemberNewHouseholds: number } {
	const newHouseholds = newHouseholdMemberCounts.length;
	if (newHouseholds === 0) {
		return { rate: 0, newHouseholds: 0, multiMemberNewHouseholds: 0 };
	}

	const multiMemberNewHouseholds = newHouseholdMemberCounts.filter((count) => count >= 2).length;
	return {
		rate: multiMemberNewHouseholds / newHouseholds,
		newHouseholds,
		multiMemberNewHouseholds
	};
}

export type PriceMemoryEntryPoint =
	| 'inventory'
	| 'replenishment'
	| 'search'
	| 'product_detail'
	| 'settings';

export function bucketPriceMemoryCount(count: number): string {
	if (count <= 0) return '0';
	if (count === 1) return '1';
	if (count <= 4) return '2-4';
	return '5+';
}

export function bucketPriceMemoryQueryLength(length: number): string {
	if (length <= 2) return '1-2';
	if (length <= 5) return '3-5';
	return '6+';
}

export function bucketPriceMemoryResultCount(count: number): string {
	if (count <= 0) return '0';
	if (count <= 3) return '1-3';
	return '4+';
}
