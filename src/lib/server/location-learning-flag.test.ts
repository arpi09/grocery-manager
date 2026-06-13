import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	isLocationLearningEnabled,
	isLocationPredictionsInReceiptEnabled
} from './location-learning-flag';

describe('location-learning-flag', () => {
	const originalEnv = process.env;

	afterEach(() => {
		process.env = originalEnv;
		vi.unstubAllEnvs();
	});

	it('defaults location learning flags to off', () => {
		vi.stubEnv('LOCATION_LEARNING_ENABLED', '');
		expect(isLocationLearningEnabled()).toBe(false);
		expect(isLocationPredictionsInReceiptEnabled()).toBe(false);
	});

	it('enables receipt location predictions when learning flag is on', () => {
		vi.stubEnv('LOCATION_LEARNING_ENABLED', 'true');
		expect(isLocationLearningEnabled()).toBe(true);
		expect(isLocationPredictionsInReceiptEnabled()).toBe(true);
	});
});
