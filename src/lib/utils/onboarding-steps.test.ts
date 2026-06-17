import { describe, expect, it } from 'vitest';
import {
	ACTIVATION_PROGRESS_KEYS,
	ACTIVATION_SCREEN_COUNT,
	ACTIVATION_SCREEN_IDS,
	progressKeyForScreen
} from './onboarding-steps';

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

	it('lists progress keys in checklist order', () => {
		expect(ACTIVATION_PROGRESS_KEYS).toEqual([
			'welcome',
			'firstScan',
			'pantryCreated',
			'brain',
			'shopping'
		]);
	});
});
