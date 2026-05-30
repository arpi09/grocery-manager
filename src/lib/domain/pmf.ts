export const PRODUCT_EVENT_TYPES = [
	'scan_completed',
	'receipt_parsed',
	'fill_suggestions_added'
] as const;

export type ProductEventType = (typeof PRODUCT_EVENT_TYPES)[number];

export const SCAN_EVENT_TYPES: ProductEventType[] = ['scan_completed', 'receipt_parsed'];

export const ACTIVATION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ACTIVATION_ITEM_THRESHOLD = 10;
export const WAU_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const PMF_TARGETS = {
	activationRate: 0.4,
	medianTimeToFirstScanMinutes: 3,
	weeklyScanRate: 0.3,
	d7Retention: 0.2,
	d30RetentionEarly: 0.15,
	d30RetentionMature: 0.25,
	multiMemberHouseholdRate: 0.5,
	smartFillWeeklyRate: 0.2
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
	eventCounts: Record<ProductEventType, number>;
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

export function medianMinutesToFirstScan(facts: FirstScanFacts[]): number | null {
	const deltas = facts
		.filter((row) => row.firstScanAt !== null)
		.map((row) => (row.firstScanAt!.getTime() - row.registeredAt.getTime()) / 60_000)
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

	return lastSeenAt.getTime() >= now.getTime() - windowMs;
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
		(user) => now.getTime() - user.createdAt.getTime() >= retentionMs
	);

	if (eligible.length === 0) {
		return { rate: 0, eligibleUsers: 0 };
	}

	const retained = eligible.filter((user) => {
		if (!user.lastSeenAt) {
			return false;
		}

		return user.lastSeenAt.getTime() - user.createdAt.getTime() >= retentionMs;
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
