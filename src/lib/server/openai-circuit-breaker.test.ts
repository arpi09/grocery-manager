import { describe, expect, it, beforeEach } from 'vitest';
import {
	isOpenAiDegradedMode,
	recordOpenAiFailure,
	resetOpenAiCircuitBreakerForTests
} from '$lib/server/openai-circuit-breaker';

describe('openai-circuit-breaker', () => {
	beforeEach(() => {
		resetOpenAiCircuitBreakerForTests();
	});

	it('enters degraded mode after repeated failures within the window', () => {
		expect(isOpenAiDegradedMode()).toBe(false);
		for (let i = 0; i < 5; i++) {
			recordOpenAiFailure();
		}
		expect(isOpenAiDegradedMode()).toBe(true);
	});
});
