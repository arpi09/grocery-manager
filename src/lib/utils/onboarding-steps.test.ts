import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_PROGRESS_KEYS,
	ACTIVATION_SCREEN_COUNT,
	ACTIVATION_SCREEN_IDS,
	canNavigateToScreen,
	canSelectProgressKey,
	nextScreen,
	previousScreen,
	progressKeyForScreen,
	screenForProgressKey,
	screenIndex
} from './onboarding-steps';
import type { ActivationOnboardingFlags } from './activation-onboarding-state';
import type { ActivationProgressKey } from './onboarding-steps';

const baseFlags = (): ActivationOnboardingFlags => ({
	welcomeSeen: false,
	scanStarted: false,
	fillDeferred: false,
	firstScanDone: false,
	inventoryCreated: false,
	staplesAdded: false,
	inviteSeen: false,
	finishSeen: false
});

describe('activation onboarding steps', () => {
	it('defines four activation screens in order', () => {
		expect(ACTIVATION_SCREEN_IDS).toEqual(['welcome', 'fill', 'invite', 'finish']);
		expect(ACTIVATION_SCREEN_COUNT).toBe(4);
	});

	it('lists progress keys in screen order (1:1)', () => {
		expect(ACTIVATION_PROGRESS_KEYS).toEqual(['welcome', 'fill', 'invite', 'finish']);
	});

	it('maps screens to progress keys 1:1', () => {
		for (const screen of ACTIVATION_SCREEN_IDS) {
			expect(progressKeyForScreen(screen)).toBe(screen);
			expect(screenForProgressKey(screen)).toBe(screen);
		}
	});

	it('screenIndex follows declaration order', () => {
		expect(screenIndex('welcome')).toBe(0);
		expect(screenIndex('fill')).toBe(1);
		expect(screenIndex('invite')).toBe(2);
		expect(screenIndex('finish')).toBe(3);
	});

	it('previousScreen and nextScreen walk the activation order', () => {
		expect(previousScreen('welcome')).toBeNull();
		expect(nextScreen('welcome')).toBe('fill');
		expect(nextScreen('fill')).toBe('invite');
		expect(nextScreen('invite')).toBe('finish');
		expect(previousScreen('finish')).toBe('invite');
		expect(nextScreen('finish')).toBeNull();
	});

	it('canSelectProgressKey allows current and earlier steps, blocks later', () => {
		const checklist: Record<ActivationProgressKey, boolean> = {
			welcome: true,
			fill: true,
			invite: false,
			finish: false
		};

		expect(canSelectProgressKey('welcome', checklist, 'fill')).toBe(true);
		expect(canSelectProgressKey('fill', checklist, 'fill')).toBe(true);
		expect(canSelectProgressKey('invite', checklist, 'fill')).toBe(false);
		expect(canSelectProgressKey('finish', checklist, 'fill')).toBe(false);
	});

	it('canSelectProgressKey without a current key requires a completed milestone', () => {
		const checklist: Record<ActivationProgressKey, boolean> = {
			welcome: true,
			fill: false,
			invite: false,
			finish: false
		};

		expect(canSelectProgressKey('welcome', checklist, null)).toBe(true);
		expect(canSelectProgressKey('fill', checklist, null)).toBe(false);
	});

	it('canNavigateToScreen allows backward preview and blocks skipping ahead', () => {
		const flags = { ...baseFlags(), welcomeSeen: true };

		expect(canNavigateToScreen('welcome', flags, 0)).toBe(true);
		expect(canNavigateToScreen('fill', flags, 0)).toBe(true);
		expect(canNavigateToScreen('invite', flags, 0)).toBe(false);
		expect(canNavigateToScreen('finish', flags, 0)).toBe(false);
	});

	it('canNavigateToScreen allows forward jump to a completed milestone', () => {
		// Invite already seen but user is back on fill (deferred nothing): checklist unlocks it.
		const flags = { ...baseFlags(), welcomeSeen: true, inviteSeen: true };

		expect(canNavigateToScreen('invite', flags, 0)).toBe(true);
		expect(canNavigateToScreen('finish', flags, 0)).toBe(false);
	});

	it('canNavigateToScreen allows invite when inventory exists', () => {
		const flags = { ...baseFlags(), welcomeSeen: true };

		expect(canNavigateToScreen('invite', flags, 1)).toBe(true);
	});

	it('canNavigateToScreen respects memberCount invite bypass', () => {
		const flags = { ...baseFlags(), welcomeSeen: true, staplesAdded: true };

		// Solo household: derived screen is invite — finish stays locked.
		expect(canNavigateToScreen('finish', flags, 1, { memberCount: 1 })).toBe(false);
		// Multi-member household: invite bypassed, derived screen is finish.
		expect(canNavigateToScreen('finish', flags, 1, { memberCount: 2 })).toBe(true);
		expect(canNavigateToScreen('invite', flags, 1, { memberCount: 2 })).toBe(true);
	});

	it('canNavigateToScreen blocks everything once the flow is complete', () => {
		const flags = { ...baseFlags(), welcomeSeen: true, staplesAdded: true, finishSeen: true };

		for (const screen of ACTIVATION_SCREEN_IDS) {
			expect(canNavigateToScreen(screen, flags, 1)).toBe(false);
		}

		expect(canNavigateToScreen('welcome', baseFlags(), 0, { flowComplete: true })).toBe(false);
	});
});
