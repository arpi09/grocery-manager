export type HouseholdInvitePromptContext =
	| 'settings'
	| 'export_prompt'
	| 'inkop'
	| 'lista'
	| 'receipt_success'
	| 'trip_completed'
	| 'list_shared';

export type ValueMomentInviteContext = Extract<
	HouseholdInvitePromptContext,
	'receipt_success' | 'trip_completed' | 'list_shared'
>;

const DISMISSED_SUFFIX = 'household-invite-dismissed';
const INKOP_DISMISSED_SUFFIX = 'household-invite-dismissed-inkop';
const INKOP_LAST_SHOWN_SUFFIX = 'household-invite-last-shown-inkop';
const GLOBAL_LAST_SHOWN_SUFFIX = 'household-invite-last-shown-global';
const ANY_INVITE_LAST_SHOWN_SUFFIX = 'household-invite-last-shown-any';
const PEAK_ITEMS_SUFFIX = 'peak-inventory-items';
const SHOPPING_EXPORT_SUFFIX = 'shopping-list-exported';
const INKOP_RATE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;
const VALUE_MOMENT_RATE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;
const INVITE_DEDUP_MS = 24 * 60 * 60 * 1000;

function storageKey(suffix: string, userId: string): string {
	return `home-pantry-${suffix}:${userId}`;
}

function valueMomentDismissSuffix(context: ValueMomentInviteContext): string {
	return `household-invite-dismissed-${context}`;
}

function valueMomentLastShownSuffix(context: ValueMomentInviteContext): string {
	return `household-invite-last-shown-${context}`;
}

export function recordPeakInventoryCount(count: number, userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId || count <= 0) {
		return;
	}

	const key = storageKey(PEAK_ITEMS_SUFFIX, userId);
	const prev = Number(localStorage.getItem(key) ?? '0');
	if (count > prev) {
		localStorage.setItem(key, String(count));
	}
}

export function getPeakInventoryCount(userId?: string | null): number {
	if (typeof localStorage === 'undefined' || !userId) {
		return 0;
	}

	return Number(localStorage.getItem(storageKey(PEAK_ITEMS_SUFFIX, userId)) ?? '0');
}

export function dismissHouseholdInvitePrompt(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(DISMISSED_SUFFIX, userId), '1');
}

function getInviteLastShown(userId: string, suffix: string): number | null {
	const raw = localStorage.getItem(storageKey(suffix, userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function recordAnyHouseholdInviteShown(userId?: string | null, now = Date.now()): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(ANY_INVITE_LAST_SHOWN_SUFFIX, userId), String(now));
}

export function recordGlobalHouseholdInviteShown(userId?: string | null, now = Date.now()): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	recordAnyHouseholdInviteShown(userId, now);
	localStorage.setItem(storageKey(GLOBAL_LAST_SHOWN_SUFFIX, userId), String(now));
}

export function wasAnyHouseholdInviteShownToday(
	userId?: string | null,
	now = Date.now()
): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	const lastShown = getInviteLastShown(userId, ANY_INVITE_LAST_SHOWN_SUFFIX);
	return lastShown !== null && now - lastShown < INVITE_DEDUP_MS;
}

/** Global modal takes precedence over contextual inköp banner when still eligible. */
export function shouldPreferGlobalHouseholdInvite(options: {
	userId?: string | null;
	memberCount: number;
	signupAt: number | null;
	now?: number;
}): boolean {
	return shouldShowHouseholdInvitePrompt(options);
}

export function shouldShowHouseholdInvitePrompt(options: {
	userId?: string | null;
	memberCount: number;
	signupAt: number | null;
	now?: number;
}): boolean {
	const { userId, memberCount, signupAt, now = Date.now() } = options;

	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (localStorage.getItem(storageKey(DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	if (wasAnyHouseholdInviteShownToday(userId, now)) {
		return false;
	}

	if (memberCount !== 1) {
		return false;
	}

	const peakItems = getPeakInventoryCount(userId);
	const dayMs = 24 * 60 * 60 * 1000;
	const daysSinceSignup =
		signupAt !== null ? Math.floor((now - signupAt) / dayMs) : 0;

	return peakItems >= 5 || daysSinceSignup >= 3 || hasShoppingListExported(userId);
}

export function recordShoppingListExport(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(SHOPPING_EXPORT_SUFFIX, userId), '1');
}

export function hasShoppingListExported(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	return localStorage.getItem(storageKey(SHOPPING_EXPORT_SUFFIX, userId)) === '1';
}

export function getGlobalHouseholdInvitePromptContext(
	userId?: string | null
): Extract<HouseholdInvitePromptContext, 'settings' | 'export_prompt'> {
	return hasShoppingListExported(userId) ? 'export_prompt' : 'settings';
}

export function hasShoppingListEngagement(
	userId: string | null | undefined,
	options: { uncheckedCount: number; checkedCount: number }
): boolean {
	if (!userId) {
		return false;
	}

	const totalItems = options.uncheckedCount + options.checkedCount;
	return hasShoppingListExported(userId) || totalItems >= 2 || options.checkedCount > 0;
}

export function dismissInkopHouseholdInvitePrompt(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(INKOP_DISMISSED_SUFFIX, userId), '1');
}

export function recordInkopHouseholdInviteShown(userId?: string | null, now = Date.now()): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	recordAnyHouseholdInviteShown(userId, now);
	localStorage.setItem(storageKey(INKOP_LAST_SHOWN_SUFFIX, userId), String(now));
}

function getInkopHouseholdInviteLastShown(userId: string): number | null {
	const raw = localStorage.getItem(storageKey(INKOP_LAST_SHOWN_SUFFIX, userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function shouldShowInkopHouseholdInvitePrompt(options: {
	userId?: string | null;
	memberCount: number;
	listHasItems: boolean;
	uncheckedCount: number;
	checkedCount: number;
	signupAt?: number | null;
	now?: number;
}): boolean {
	const {
		userId,
		memberCount,
		listHasItems,
		uncheckedCount,
		checkedCount,
		signupAt = null,
		now = Date.now()
	} = options;

	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (
		shouldPreferGlobalHouseholdInvite({
			userId,
			memberCount,
			signupAt,
			now
		})
	) {
		return false;
	}

	if (wasAnyHouseholdInviteShownToday(userId, now)) {
		return false;
	}

	if (localStorage.getItem(storageKey(INKOP_DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	if (memberCount !== 1) {
		return false;
	}

	if (!listHasItems) {
		return false;
	}

	if (!hasShoppingListEngagement(userId, { uncheckedCount, checkedCount })) {
		return false;
	}

	const lastShown = getInkopHouseholdInviteLastShown(userId);
	if (lastShown !== null && now - lastShown < INKOP_RATE_LIMIT_MS) {
		return false;
	}

	return true;
}

export function dismissValueMomentInvite(
	context: ValueMomentInviteContext,
	userId?: string | null
): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(valueMomentDismissSuffix(context), userId), '1');
}

export function recordValueMomentInviteShown(
	context: ValueMomentInviteContext,
	userId?: string | null,
	now = Date.now()
): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(valueMomentLastShownSuffix(context), userId), String(now));
}

function getValueMomentInviteLastShown(
	context: ValueMomentInviteContext,
	userId: string
): number | null {
	const raw = localStorage.getItem(storageKey(valueMomentLastShownSuffix(context), userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function shouldShowValueMomentInvite(options: {
	context: ValueMomentInviteContext;
	userId?: string | null;
	memberCount: number;
	now?: number;
	rateLimitMs?: number;
}): boolean {
	const { context, userId, memberCount, now = Date.now(), rateLimitMs = VALUE_MOMENT_RATE_LIMIT_MS } =
		options;

	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (memberCount !== 1) {
		return false;
	}

	if (localStorage.getItem(storageKey(valueMomentDismissSuffix(context), userId)) === '1') {
		return false;
	}

	if (context === 'trip_completed') {
		const lastShown = getValueMomentInviteLastShown(context, userId);
		if (lastShown !== null && now - lastShown < rateLimitMs) {
			return false;
		}
	}

	return true;
}
