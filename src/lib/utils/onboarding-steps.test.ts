import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_PROGRESS_KEYS,
	ACTIVATION_SCREEN_IDS,
	canNavigateToScreen,
	canSelectProgressKey,
	nextScreen,
	previousScreen,
	progressKeyForScreen,
	screenForProgressKey
} from './onboarding-steps';
import type { ActivationOnboardingFlags } from './activation-onboarding-state';
import type { ActivationProgressKey } from './onboarding-steps';

const baseFlags = (): ActivationOnboardingFlags => ({
	welcomeSeen: false,
	scanStarted: false,
	scanDeferred: false,
	firstScanDone: false,
	inventoryCreated: false,
	successSeen: false,
	brainSeen: false,
	shoppingSeen: false
});

describe('activation onboarding steps', () => {
	it('defines five activation screens in order', () => {
		expect(ACTIVATION_SCREEN_IDS).toEqual(['welcome', 'scan', 'success', 'brain', 'shopping']);
	});

	it('maps screens to progress checklist keys', () => {
		expect(progressKeyForScreen('welcome')).toBe('welcome');
		expect(progressKeyForScreen('scan')).toBe('firstScan');
		expect(progressKeyForScreen('success')).toBe('pantryCreated');
		expect(progressKeyForScreen('brain')).toBe('brain');
		expect(progressKeyForScreen('shopping')).toBe('shopping');
	});

	it('maps progress keys back to screens', () => {
		expect(screenForProgressKey('welcome')).toBe('welcome');
		expect(screenForProgressKey('firstScan')).toBe('scan');
		expect(screenForProgressKey('pantryCreated')).toBe('success');
		expect(screenForProgressKey('brain')).toBe('brain');
		expect(screenForProgressKey('shopping')).toBe('shopping');
	});

	it('lists progress keys in checklist order', () => {
		expect(ACTIVATION_PROGRESS_KEYS).toEqual([
			'welcome',
			'firstScan',
			'pantryCreated',
			'brain',
			'shopping'
		]);
	});

	it('canSelectProgressKey allows current and earlier steps', () => {
		const checklist: Record<ActivationProgressKey, boolean> = {
			welcome: true,
			firstScan: true,
			pantryCreated: false,
			brain: false,
			shopping: false
		};

		expect(canSelectProgressKey('welcome', checklist, 'firstScan')).toBe(true);
		expect(canSelectProgressKey('firstScan', checklist, 'firstScan')).toBe(true);
		expect(canSelectProgressKey('pantryCreated', checklist, 'firstScan')).toBe(false);
		expect(canSelectProgressKey('brain', checklist, 'firstScan')).toBe(false);
	});

	it('previousScreen and nextScreen walk the activation order', () => {
		expect(previousScreen('welcome')).toBeNull();
		expect(nextScreen('welcome')).toBe('scan');
		expect(previousScreen('shopping')).toBe('brain');
		expect(nextScreen('shopping')).toBeNull();
	});

	it('canNavigateToScreen allows backward preview and blocks skipping ahead', () => {
		const flags = { ...baseFlags(), welcomeSeen: true };

		expect(canNavigateToScreen('welcome', flags, 0)).toBe(true);
		expect(canNavigateToScreen('scan', flags, 0)).toBe(true);
		expect(canNavigateToScreen('success', flags, 0)).toBe(false);
	});

	it('canNavigateToScreen allows success when inventory exists', () => {
		const flags = { ...baseFlags(), welcomeSeen: true, firstScanDone: true };

		expect(canNavigateToScreen('success', flags, 1)).toBe(true);
	});
});
