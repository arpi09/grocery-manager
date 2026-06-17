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
		scanDeferred: false,
		firstScanDone: false,
		inventoryCreated: false,
		successSeen: false,
		brainSeen: false,
		shoppingSeen: false,
		...overrides
	};
}

describe('deriveActivationScreen', () => {
	it('starts on welcome when nothing seen and inventory empty', () => {
		expect(deriveActivationScreen(emptyFlags(), 0, false)).toBe('welcome');
	});

	it('shows scan after welcome seen without inventory', () => {
		expect(deriveActivationScreen(emptyFlags({ welcomeSeen: true }), 0, false)).toBe('scan');
	});

	it('shows success after first scan even when inventory count lags', () => {
		expect(
			deriveActivationScreen(emptyFlags({ welcomeSeen: true, firstScanDone: true }), 0, false)
		).toBe('success');
	});

	it('shows success when server inventory count is positive', () => {
		expect(deriveActivationScreen(emptyFlags({ welcomeSeen: true }), 2, false)).toBe('success');
	});

	it('progresses welcome → scan → success → brain → shopping', () => {
		let flags = emptyFlags();
		expect(deriveActivationScreen(flags, 0, false)).toBe('welcome');

		flags = { ...flags, welcomeSeen: true };
		expect(deriveActivationScreen(flags, 0, false)).toBe('scan');

		flags = { ...flags, firstScanDone: true, inventoryCreated: true };
		expect(deriveActivationScreen(flags, 1, false)).toBe('success');

		flags = { ...flags, successSeen: true };
		expect(deriveActivationScreen(flags, 1, false)).toBe('brain');

		flags = { ...flags, brainSeen: true };
		expect(deriveActivationScreen(flags, 1, false)).toBe('shopping');
	});

	it('returns complete when shopping seen or flow complete', () => {
		expect(deriveActivationScreen(emptyFlags({ shoppingSeen: true }), 0, false)).toBe('complete');
		expect(deriveActivationScreen(emptyFlags(), 0, true)).toBe('complete');
	});

	it('skips success when receipt import recently completed', () => {
		const flags = emptyFlags({
			welcomeSeen: true,
			firstScanDone: true,
			inventoryCreated: true
		});
		expect(deriveActivationScreen(flags, 3, false, { skipSuccessScreen: true })).toBe('brain');
	});
});

describe('getActivationProgressChecklist', () => {
	it('marks milestones from real flags and inventory count', () => {
		const checklist = getActivationProgressChecklist(
			emptyFlags({
				welcomeSeen: true,
				firstScanDone: true,
				inventoryCreated: true
			}),
			0
		);
		expect(checklist.welcome).toBe(true);
		expect(checklist.firstScan).toBe(true);
		expect(checklist.pantryCreated).toBe(true);
		expect(checklist.brain).toBe(false);
		expect(checklist.shopping).toBe(false);
	});

	it('marks pantry created from inventory count alone', () => {
		const checklist = getActivationProgressChecklist(emptyFlags(), 2);
		expect(checklist.pantryCreated).toBe(true);
		expect(checklist.firstScan).toBe(false);
	});
});
