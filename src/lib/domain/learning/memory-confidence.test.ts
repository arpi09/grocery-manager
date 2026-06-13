import { describe, expect, it } from 'vitest';
import {
	meetsMemoryExplorerMinSamples,
	sampleCountToConfidenceTier
} from './memory-confidence';

describe('memory-confidence', () => {
	it('maps sample counts to confidence tiers', () => {
		expect(sampleCountToConfidenceTier(1)).toBeNull();
		expect(sampleCountToConfidenceTier(2)).toBe('medium');
		expect(sampleCountToConfidenceTier(4)).toBe('medium');
		expect(sampleCountToConfidenceTier(5)).toBe('high');
	});

	it('filters facets below minimum samples', () => {
		expect(meetsMemoryExplorerMinSamples(1)).toBe(false);
		expect(meetsMemoryExplorerMinSamples(2)).toBe(true);
	});
});
