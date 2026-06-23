import { describe, expect, it, afterEach } from 'vitest';
import { isReplenishmentLearningEnabled } from './replenishment-learning-flag';

describe('replenishment-learning-flag', () => {
	const original = process.env.REPLENISHMENT_LEARNING_ENABLED;

	afterEach(() => {
		if (original === undefined) {
			delete process.env.REPLENISHMENT_LEARNING_ENABLED;
		} else {
			process.env.REPLENISHMENT_LEARNING_ENABLED = original;
		}
	});

	it('defaults learning flag to true', () => {
		delete process.env.REPLENISHMENT_LEARNING_ENABLED;
		expect(isReplenishmentLearningEnabled()).toBe(true);
	});

	it('enables learning when env is true', () => {
		process.env.REPLENISHMENT_LEARNING_ENABLED = 'true';
		expect(isReplenishmentLearningEnabled()).toBe(true);
	});
});
