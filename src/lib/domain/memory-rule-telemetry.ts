export type MemoryRuleFacetType = 'shelf_life' | 'location';

export type MemoryRuleEventType =
	| 'memory_rule_created'
	| 'memory_rule_updated'
	| 'memory_rule_rejected';

export interface MemoryRuleTelemetryEvent {
	householdId: string;
	userId: string;
	eventType: MemoryRuleEventType;
	facetType: MemoryRuleFacetType;
	normalizedKey: string;
	field?: 'typicalDays' | 'location';
}

export function resolveShelfLifeMemoryRuleEvent(input: {
	existing: { typicalDays: number; sampleCount: number } | null;
	sampleCount: number;
	typicalDays: number;
}): 'memory_rule_created' | 'memory_rule_updated' | null {
	if (!input.existing) {
		return input.sampleCount >= 2 ? 'memory_rule_created' : null;
	}
	if (input.existing.sampleCount < 2 && input.sampleCount >= 2) {
		return 'memory_rule_created';
	}
	if (input.existing.typicalDays !== input.typicalDays) {
		return 'memory_rule_updated';
	}
	return null;
}

export function resolveLocationMemoryRuleEvent(input: {
	existing: { location: string; sampleCount: number } | null;
	sampleCount: number;
	location: string;
}): 'memory_rule_created' | 'memory_rule_updated' | null {
	if (!input.existing) {
		return input.sampleCount >= 2 ? 'memory_rule_created' : null;
	}
	if (input.existing.sampleCount < 2 && input.sampleCount >= 2) {
		return 'memory_rule_created';
	}
	if (input.existing.location !== input.location) {
		return 'memory_rule_updated';
	}
	return null;
}
