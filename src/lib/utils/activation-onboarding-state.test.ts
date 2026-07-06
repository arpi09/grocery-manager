import { describe, expect, it } from 'vitest';
import {
	deriveActivationScreen,
	getActivationProgressChecklist,
	type ActivationOnboardingFlags
} from './activation-onboarding-state';

function emptyFlags(overrides: Partial<ActivationOnboardingFlags> = {}): ActivationOnboardingFlags {
	return {
		welcomeSeen: false,
		scanStarted: false,
		fillDeferred: false,
		firstScanDone: false,
		inventoryCreated: false,
		staplesAdded: false,
		inviteSeen: false,
		finishSeen: false,
		...overrides
	};
}

describe('deriveActivationScreen', () => {
	it('starts on welcome when nothing seen and inventory empty', () => {
		expect(deriveActivationScreen(emptyFlags(), 0, false)).toBe('welcome');
	});

	it('shows fill after welcome seen without inventory', () => {
		expect(deriveActivationScreen(emptyFlags({ welcomeSeen: true }), 0, false)).toBe('fill');
	});

	it('progresses welcome → fill → invite → finish', () => {
		let flags = emptyFlags();
		expect(deriveActivationScreen(flags, 0, false)).toBe('welcome');

		flags = { ...flags, welcomeSeen: true };
		expect(deriveActivationScreen(flags, 0, false)).toBe('fill');

		flags = { ...flags, staplesAdded: true, inventoryCreated: true };
		expect(deriveActivationScreen(flags, 1, false)).toBe('invite');

		flags = { ...flags, inviteSeen: true };
		expect(deriveActivationScreen(flags, 1, false)).toBe('finish');
	});

	it('skips fill when server inventory count is positive', () => {
		expect(deriveActivationScreen(emptyFlags({ welcomeSeen: true }), 2, false)).toBe('invite');
	});

	it('skips fill when staples were added even if inventory count lags', () => {
		expect(
			deriveActivationScreen(emptyFlags({ welcomeSeen: true, staplesAdded: true }), 0, false)
		).toBe('invite');
	});

	it('skips fill when first scan is done even if inventory count lags', () => {
		expect(
			deriveActivationScreen(emptyFlags({ welcomeSeen: true, firstScanDone: true }), 0, false)
		).toBe('invite');
	});

	it('moves past fill when deferred with empty inventory', () => {
		expect(
			deriveActivationScreen(emptyFlags({ welcomeSeen: true, fillDeferred: true }), 0, false)
		).toBe('invite');
	});

	it('stays on fill when not deferred and nothing seeded', () => {
		expect(deriveActivationScreen(emptyFlags({ welcomeSeen: true }), 0, false)).toBe('fill');
	});

	it('bypasses invite when household already has more than one member', () => {
		const flags = emptyFlags({ welcomeSeen: true, staplesAdded: true });
		expect(deriveActivationScreen(flags, 1, false, { memberCount: 2 })).toBe('finish');
	});

	it('shows invite for single-member households', () => {
		const flags = emptyFlags({ welcomeSeen: true, staplesAdded: true });
		expect(deriveActivationScreen(flags, 1, false, { memberCount: 1 })).toBe('invite');
		expect(deriveActivationScreen(flags, 1, false)).toBe('invite');
	});

	it('returns complete when finish seen or flow complete', () => {
		expect(deriveActivationScreen(emptyFlags({ finishSeen: true }), 0, false)).toBe('complete');
		expect(deriveActivationScreen(emptyFlags(), 0, true)).toBe('complete');
	});
});

describe('getActivationProgressChecklist', () => {
	it('marks milestones from real flags', () => {
		const checklist = getActivationProgressChecklist(
			emptyFlags({
				welcomeSeen: true,
				staplesAdded: true,
				inviteSeen: true
			}),
			0
		);
		expect(checklist.welcome).toBe(true);
		expect(checklist.fill).toBe(true);
		expect(checklist.invite).toBe(true);
		expect(checklist.finish).toBe(false);
	});

	it('marks fill from inventory count alone', () => {
		const checklist = getActivationProgressChecklist(emptyFlags(), 2);
		expect(checklist.fill).toBe(true);
		expect(checklist.welcome).toBe(false);
	});

	it('marks fill from first scan done without inventory count', () => {
		const checklist = getActivationProgressChecklist(emptyFlags({ firstScanDone: true }), 0);
		expect(checklist.fill).toBe(true);
	});

	it('does not mark fill from deferral', () => {
		const checklist = getActivationProgressChecklist(emptyFlags({ fillDeferred: true }), 0);
		expect(checklist.fill).toBe(false);
	});

	it('marks finish only when finish seen', () => {
		const checklist = getActivationProgressChecklist(emptyFlags({ finishSeen: true }), 0);
		expect(checklist.finish).toBe(true);
	});
});
