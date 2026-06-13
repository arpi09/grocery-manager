import type { PredictorId } from '$lib/domain/learning/predictor-types';

/** User-visible provenance for any Brain prediction. */
export type TrustSource =
	| 'household_rule'
	| 'heuristic'
	| 'evidence'
	| 'catalog'
	| 'llm'
	| 'manual'
	| 'default';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ConfidenceScore {
	/** Internal 0–1 score; not shown raw in UI by default. */
	value: number;
	tier: ConfidenceTier;
}

export interface ProvenanceMeta {
	normalizedKey: string;
	displayName?: string;
	sampleCount?: number;
	lastUpdatedAt?: string;
	evidenceWindowDays?: number;
	importCount?: number;
	purchaseCount?: number;
	location?: string;
	purchasedAt?: string | null;
	storeLabel?: string | null;
}

export interface PredictionExplanation {
	primary: string;
	facts: string[];
	learnMore?: string;
	templateId: string;
}

export interface PredictionTrust<T> {
	kind: PredictorId;
	value: T;
	source: TrustSource;
	confidence: ConfidenceScore;
	provenance: ProvenanceMeta;
	explanation: PredictionExplanation;
	feedbackEligible: boolean;
	modelVersion: string;
}

const HIGH_CONFIDENCE_MIN = 0.75;
const MEDIUM_CONFIDENCE_MIN = 0.5;

export function confidenceToTier(value: number): ConfidenceTier {
	if (value >= HIGH_CONFIDENCE_MIN) return 'high';
	if (value >= MEDIUM_CONFIDENCE_MIN) return 'medium';
	return 'low';
}

export function isFeedbackEligibleSource(source: TrustSource): boolean {
	return source !== 'manual';
}

/** i18n key under `learning.source*` for badge hints. */
export function trustSourceLabelKey(source: TrustSource): string | null {
	switch (source) {
		case 'household_rule':
			return 'learning.sourceHousehold';
		case 'heuristic':
		case 'llm':
		case 'default':
			return 'learning.sourceDefault';
		case 'evidence':
			return 'learning.sourceReceipt';
		case 'catalog':
			return 'learning.sourceCatalog';
		case 'manual':
			return null;
	}
}
