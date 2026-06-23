import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { PredictionSource } from '$lib/domain/learning/predictor-types';
import {
	confidenceToTier,
	type ConfidenceTier
} from '$lib/domain/learning/prediction-trust';

export type ExpiryBadgeSource = ExpiresOnSource | PredictionSource | null | undefined;

export interface ExpiryBadgePresentation {
	labelKey: string;
	sourceHintKey: string | null;
	color: string | null;
	tone: 'default' | 'warning' | 'location';
	lowConfidence: boolean;
	confidenceTier: ConfidenceTier | null;
}

const SOURCE_COLORS: Partial<Record<string, string>> = {
	household_learned: '#2d6a4f',
	household_rule: '#2d6a4f',
	receipt_printed: '#1d4ed8',
	evidence: '#1d4ed8',
	ai_inferred: '#6b4c9a',
	external_model: '#6b4c9a',
	llm: '#6b4c9a',
	heuristic: '#6b7280',
	default_heuristic: '#6b7280',
	default: '#6b7280',
	location_default: '#0f766e',
	catalog: '#475569'
};

function sourceHintKey(source: ExpiryBadgeSource): string | null {
	if (!source) return null;
	const normalized = String(source);
	if (normalized === 'household_learned' || normalized === 'household_rule') {
		return 'learning.sourceHousehold';
	}
	if (normalized === 'location_default') return 'learning.sourceLocationDefault';
	if (normalized === 'ai_inferred' || normalized === 'external_model' || normalized === 'llm') {
		return 'learning.sourceAiGuess';
	}
	if (normalized === 'receipt_printed' || normalized === 'evidence') return 'learning.sourceReceipt';
	if (
		normalized === 'heuristic' ||
		normalized === 'default_heuristic' ||
		normalized === 'default' ||
		normalized === 'catalog'
	) {
		return 'learning.sourceDefault';
	}
	return null;
}

export function presentExpiryBadge(input: {
	source?: ExpiryBadgeSource;
	confidence?: number | null;
	lowConfidence?: boolean;
}): ExpiryBadgePresentation {
	const tier = input.confidence != null ? confidenceToTier(input.confidence) : null;
	const lowConfidence = input.lowConfidence ?? tier === 'low';
	const source = input.source ?? null;
	const normalizedSource = source ? String(source) : null;

	let labelKey = 'learning.estimatedExpiry';
	if (lowConfidence) {
		labelKey = 'learning.lowConfidence';
	} else if (tier === 'high' && (normalizedSource === 'household_learned' || normalizedSource === 'household_rule')) {
		labelKey = 'learning.confidenceSure';
	} else if (tier === 'high' && (normalizedSource === 'receipt_printed' || normalizedSource === 'evidence')) {
		labelKey = 'learning.confidenceSure';
	}

	return {
		labelKey,
		sourceHintKey: sourceHintKey(source),
		color: source ? (SOURCE_COLORS[source] ?? null) : null,
		tone: lowConfidence ? 'warning' : 'default',
		lowConfidence,
		confidenceTier: tier
	};
}
