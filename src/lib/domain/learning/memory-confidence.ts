import type { ConfidenceTier } from './prediction-trust';
import { HOUSEHOLD_SHELF_LIFE_MIN_SAMPLES } from './shelf-life-learning';

const HIGH_SAMPLE_MIN = 5;

export function meetsMemoryExplorerMinSamples(sampleCount: number): boolean {
	return sampleCount >= HOUSEHOLD_SHELF_LIFE_MIN_SAMPLES;
}

export function sampleCountToConfidenceTier(sampleCount: number): ConfidenceTier | null {
	if (!meetsMemoryExplorerMinSamples(sampleCount)) return null;
	if (sampleCount >= HIGH_SAMPLE_MIN) return 'high';
	return 'medium';
}
