import { describe, expect, it } from 'vitest';
import { buildBrainTimelineEntries } from './brain-timeline';

describe('buildBrainTimelineEntries', () => {
	const referenceDate = new Date('2026-06-23T12:00:00');

	it('builds shelf life learned entry', () => {
		const entries = buildBrainTimelineEntries({
			shelfLifeRules: [
				{
					normalizedKey: 'mjolk',
					location: 'fridge',
					typicalDays: 9,
					sampleCount: 4,
					updatedAt: new Date('2026-06-22T10:00:00')
				}
			],
			locationRules: [],
			events: [],
			referenceDate
		});

		expect(entries).toHaveLength(1);
		expect(entries[0].kind).toBe('shelf_life_learned');
		expect(entries[0].messageParams.days).toBe(9);
		expect(entries[0].messageParams.when).toBe('yesterday');
	});

	it('limits to requested count', () => {
		const entries = buildBrainTimelineEntries({
			shelfLifeRules: [
				{
					normalizedKey: 'a',
					location: 'fridge',
					typicalDays: 5,
					sampleCount: 3,
					updatedAt: new Date('2026-06-23T08:00:00')
				},
				{
					normalizedKey: 'b',
					location: 'cupboard',
					typicalDays: 30,
					sampleCount: 3,
					updatedAt: new Date('2026-06-22T08:00:00')
				}
			],
			locationRules: [],
			events: [],
			limit: 1,
			referenceDate
		});

		expect(entries).toHaveLength(1);
	});
});
