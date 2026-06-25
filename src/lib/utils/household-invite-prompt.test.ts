import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	dismissHouseholdInvitePrompt,
	dismissInkopHouseholdInvitePrompt,
	dismissValueMomentInvite,
	getGlobalHouseholdInvitePromptContext,
	hasShoppingListEngagement,
	recordGlobalHouseholdInviteShown,
	recordInkopHouseholdInviteShown,
	recordPeakInventoryCount,
	recordShoppingListExport,
	recordValueMomentInviteShown,
	shouldShowHouseholdInvitePrompt,
	shouldShowInkopHouseholdInvitePrompt,
	shouldShowValueMomentInvite,
	wasAnyHouseholdInviteShownToday
} from './household-invite-prompt';

const TEST_USER = 'user-inkop-invite';
const TEST_GLOBAL_USER = 'user-global-invite';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

describe('global household invite prompt', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const baseOptions = {
		userId: TEST_GLOBAL_USER,
		memberCount: 1,
		signupAt: Date.UTC(2026, 5, 1)
	};

	it('shows after shopping list export even without inventory depth or signup age', () => {
		const now = Date.UTC(2026, 5, 2);
		recordShoppingListExport(TEST_GLOBAL_USER);

		expect(
			shouldShowHouseholdInvitePrompt({
				...baseOptions,
				now
			})
		).toBe(true);
	});

	it('shows when peak inventory reaches five items', () => {
		recordPeakInventoryCount(5, TEST_GLOBAL_USER);

		expect(
			shouldShowHouseholdInvitePrompt({
				...baseOptions,
				now: baseOptions.signupAt + 1
			})
		).toBe(true);
	});

	it('shows when signup is at least three days ago', () => {
		expect(
			shouldShowHouseholdInvitePrompt({
				...baseOptions,
				now: baseOptions.signupAt + THREE_DAYS_MS
			})
		).toBe(true);
	});

	it('hides when dismissed permanently', () => {
		recordShoppingListExport(TEST_GLOBAL_USER);
		dismissHouseholdInvitePrompt(TEST_GLOBAL_USER);

		expect(shouldShowHouseholdInvitePrompt(baseOptions)).toBe(false);
	});

	it('uses export_prompt context after shopping list export', () => {
		recordShoppingListExport(TEST_GLOBAL_USER);
		expect(getGlobalHouseholdInvitePromptContext(TEST_GLOBAL_USER)).toBe('export_prompt');
	});

	it('uses settings context without shopping list export', () => {
		expect(getGlobalHouseholdInvitePromptContext(TEST_GLOBAL_USER)).toBe('settings');
	});
});

describe('inkop household invite prompt', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const baseOptions = {
		userId: TEST_USER,
		memberCount: 1,
		listHasItems: true,
		uncheckedCount: 2,
		checkedCount: 0
	};

	it('shows when solo household has items and shopping engagement', () => {
		expect(shouldShowInkopHouseholdInvitePrompt(baseOptions)).toBe(true);
	});

	it('hides when member count is not one', () => {
		expect(
			shouldShowInkopHouseholdInvitePrompt({ ...baseOptions, memberCount: 2 })
		).toBe(false);
	});

	it('hides when list has no items', () => {
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				listHasItems: false,
				uncheckedCount: 0,
				checkedCount: 0
			})
		).toBe(false);
	});

	it('hides when shopping engagement is missing', () => {
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				uncheckedCount: 1,
				checkedCount: 0
			})
		).toBe(false);
	});

	it('shows with one unchecked item when user has checked items', () => {
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				uncheckedCount: 1,
				checkedCount: 1
			})
		).toBe(true);
	});

	it('shows with one item after export', () => {
		recordShoppingListExport(TEST_USER);
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				uncheckedCount: 1,
				checkedCount: 0
			})
		).toBe(true);
	});

	it('hides when dismissed permanently', () => {
		dismissInkopHouseholdInvitePrompt(TEST_USER);
		expect(shouldShowInkopHouseholdInvitePrompt(baseOptions)).toBe(false);
	});

	it('rate limits to one show per seven days', () => {
		const now = Date.UTC(2026, 5, 11);
		recordInkopHouseholdInviteShown(TEST_USER, now);

		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				now: now + SEVEN_DAYS_MS - 1
			})
		).toBe(false);

		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				now: now + SEVEN_DAYS_MS
			})
		).toBe(true);
	});

	it('hides inkop banner when global invite is still eligible', () => {
		recordShoppingListExport(TEST_USER);
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				userId: TEST_USER,
				signupAt: Date.UTC(2026, 5, 1)
			})
		).toBe(false);
	});

	it('dedupes global and inkop to one show per day', () => {
		const now = Date.UTC(2026, 5, 15);
		recordInkopHouseholdInviteShown(TEST_USER, now);
		expect(wasAnyHouseholdInviteShownToday(TEST_USER, now + 1)).toBe(true);
		expect(
			shouldShowHouseholdInvitePrompt({
				userId: TEST_GLOBAL_USER,
				memberCount: 1,
				signupAt: Date.UTC(2026, 5, 1),
				now: now + 1
			})
		).toBe(false);
	});

	it('records global show and blocks inkop same day', () => {
		const now = Date.UTC(2026, 5, 16);
		recordGlobalHouseholdInviteShown(TEST_USER, now);
		expect(
			shouldShowInkopHouseholdInvitePrompt({
				...baseOptions,
				signupAt: null,
				now: now + 1
			})
		).toBe(false);
	});

	it('detects shopping list engagement signals', () => {
		expect(
			hasShoppingListEngagement(TEST_USER, { uncheckedCount: 2, checkedCount: 0 })
		).toBe(true);
		expect(
			hasShoppingListEngagement(TEST_USER, { uncheckedCount: 1, checkedCount: 1 })
		).toBe(true);
		expect(
			hasShoppingListEngagement(TEST_USER, { uncheckedCount: 1, checkedCount: 0 })
		).toBe(false);

		recordShoppingListExport(TEST_USER);
		expect(
			hasShoppingListEngagement(TEST_USER, { uncheckedCount: 1, checkedCount: 0 })
		).toBe(true);
	});
});

describe('value moment invite prompts', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const soloOptions = {
		userId: 'solo-user',
		memberCount: 1
	};

	it('shows receipt_success once for solo household', () => {
		expect(shouldShowValueMomentInvite({ ...soloOptions, context: 'receipt_success' })).toBe(
			true
		);
		dismissValueMomentInvite('receipt_success', soloOptions.userId);
		expect(shouldShowValueMomentInvite({ ...soloOptions, context: 'receipt_success' })).toBe(
			false
		);
	});

	it('rate limits trip_completed to once per seven days', () => {
		const now = Date.UTC(2026, 5, 20);
		recordValueMomentInviteShown('trip_completed', soloOptions.userId, now);

		expect(
			shouldShowValueMomentInvite({
				...soloOptions,
				context: 'trip_completed',
				now: now + SEVEN_DAYS_MS - 1
			})
		).toBe(false);

		expect(
			shouldShowValueMomentInvite({
				...soloOptions,
				context: 'trip_completed',
				now: now + SEVEN_DAYS_MS
			})
		).toBe(true);
	});

	it('hides value moment prompts for multi-member households', () => {
		expect(
			shouldShowValueMomentInvite({
				userId: 'solo-user',
				memberCount: 2,
				context: 'list_shared'
			})
		).toBe(false);
	});
});
