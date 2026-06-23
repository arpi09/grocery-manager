import type { ConfidenceTier } from './prediction-trust';

const HIGH_SAMPLE_MIN = 5;
const MEDIUM_SAMPLE_MIN = 3;

export function meetsMemoryExplorerMinSamples(sampleCount: number): boolean {
	return sampleCount >= 1;
}

export function sampleCountToConfidenceTier(sampleCount: number): ConfidenceTier | null {
	if (sampleCount < 1) return null;
	if (sampleCount < MEDIUM_SAMPLE_MIN) return 'low';
	if (sampleCount >= HIGH_SAMPLE_MIN) return 'high';
	return 'medium';
}
