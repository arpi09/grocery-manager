import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_PROGRESS_KEYS,
	ACTIVATION_SCREEN_COUNT,
	ACTIVATION_SCREEN_IDS,
	canSelectProgressKey,
	progressKeyForScreen,
	screenForProgressKey
} from './onboarding-steps';
import type { ActivationProgressKey } from './onboarding-steps';

describe('activation onboarding steps', () => {
	it('defines five activation screens in order', () => {
		expect(ACTIVATION_SCREEN_COUNT).toBe(5);
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

	it('canSelectProgressKey allows done and current steps only', () => {
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
});