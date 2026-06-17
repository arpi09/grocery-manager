import { describe, expect, it } from 'vitest';
import {
	resolveLocationMemoryRuleEvent,
	resolveShelfLifeMemoryRuleEvent
} from './memory-rule-telemetry';

describe('memory-rule-telemetry', () => {
	it('creates shelf-life rule when sample count reaches two', () => {
		expect(
			resolveShelfLifeMemoryRuleEvent({
				existing: { typicalDays: 5, sampleCount: 1 },
				sampleCount: 2,
				typicalDays: 6
			})
		).toBe('memory_rule_created');
	});

	it('updates shelf-life rule when typical days change', () => {
		expect(
			resolveShelfLifeMemoryRuleEvent({
				existing: { typicalDays: 5, sampleCount: 3 },
				sampleCount: 4,
				typicalDays: 7
			})
		).toBe('memory_rule_updated');
	});

	it('creates location rule when sample count reaches two', () => {
		expect(
			resolveLocationMemoryRuleEvent({
				existing: { location: 'fridge', sampleCount: 1 },
				sampleCount: 2,
				location: 'fridge'
			})
		).toBe('memory_rule_created');
	});
});
