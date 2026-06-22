import { addDaysIso } from '$lib/domain/auto-expired';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { PredictionSource } from '$lib/domain/learning/predictor-types';

export const HOUSEHOLD_SHELF_LIFE_MIN_SAMPLES = 2;

export function formatTodayIso(today = new Date()): string {
	const y = today.getFullYear();
	const m = String(today.getMonth() + 1).padStart(2, '0');
	const d = String(today.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function daysBetweenIso(fromIso: string, toIso: string): number {
	const [fromY, fromM, fromD] = fromIso.split('-').map(Number);
	const [toY, toM, toD] = toIso.split('-').map(Number);
	const from = new Date(fromY, fromM - 1, fromD);
	const to = new Date(toY, toM - 1, toD);
	return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeExpiresOn(
	typicalDays: number,
	purchasedAt: string | null,
	todayIso = formatTodayIso()
): string {
	const base = purchasedAt ?? todayIso;
	return addDaysIso(base, typicalDays);
}

export function computeTypicalDaysFromDates(referenceDate: string, expiresOn: string): number {
	return daysBetweenIso(referenceDate, expiresOn);
}

export function medianOf(values: number[]): number {
	if (values.length === 0) {
		throw new Error('medianOf requires at least one value');
	}
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 0) {
		return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
	}
	return sorted[mid];
}

/** Updates a materialized median when only typical_days + sample_count are stored. */
export function updateMaterializedMedian(
	typicalDays: number,
	sampleCount: number,
	observedDays: number
): number {
	if (sampleCount <= 0) return observedDays;
	const values = Array.from({ length: sampleCount }, () => typicalDays);
	values.push(observedDays);
	return medianOf(values);
}

export function isHouseholdRuleReady(sampleCount: number): boolean {
	return sampleCount >= HOUSEHOLD_SHELF_LIFE_MIN_SAMPLES;
}

export function predictionSourceToExpiresOnSource(source: PredictionSource): ExpiresOnSource {
	switch (source) {
		case 'household_rule':
			return 'household_learned';
		case 'heuristic':
			return 'heuristic';
		case 'location_default':
			return 'default_heuristic';
		case 'external_model':
			return 'heuristic';
	}
}

export function predictionSourceConfidence(source: PredictionSource): number {
	switch (source) {
		case 'household_rule':
			return 0.85;
		case 'heuristic':
			return 0.55;
		case 'location_default':
			return 0.25;
		case 'external_model':
			return 0.7;
	}
}
