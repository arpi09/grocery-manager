import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import type { PredictionSource } from '$lib/domain/learning/predictor-types';
import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
import { buildLocationExplanation } from '$lib/domain/learning/location-explanation';
import {
	buildShelfLifeExplanation,
	type ShelfLifeExplanationTemplateId
} from '$lib/domain/learning/shelf-life-explanation';
import type { Locale } from '$lib/i18n/locale';
import { DEFAULT_LOCALE } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

export interface ShelfLifeExplainInput {
	source: ExpiresOnSource | PredictionSource;
	typicalDays?: number | null;
	location?: StorageLocation;
	sampleCount?: number;
	purchasedAt?: string | null;
	displayName?: string;
	normalizedKey?: string;
}

export interface LocationExplainInput {
	source: PredictionSource;
	location: StorageLocation;
	productName?: string;
	sampleCount?: number;
	normalizedKey?: string;
}

function isHouseholdSource(source: ExpiresOnSource | PredictionSource): boolean {
	return source === 'household_learned' || source === 'household_rule';
}

function isHeuristicSource(source: ExpiresOnSource | PredictionSource): boolean {
	return (
		source === 'heuristic' ||
		source === 'ai_inferred' ||
		source === 'external_model' ||
		source === 'default_heuristic' ||
		source === 'location_default'
	);
}

function shelfLifeTemplateId(
	source: ExpiresOnSource | PredictionSource
): ShelfLifeExplanationTemplateId | null {
	if (isHouseholdSource(source)) return 'shelf_life.household';
	if (isHeuristicSource(source)) return 'shelf_life.heuristic';
	return null;
}

export function buildShelfLifeExplanationFromSource(
	locale: Locale,
	input: ShelfLifeExplainInput
): PredictionExplanation | null {
	const templateId = shelfLifeTemplateId(input.source);
	const normalizedKey = input.normalizedKey ?? normalizeReceiptProductName(input.displayName ?? '');
	if (!templateId || !normalizedKey) return null;

	const explanation = buildShelfLifeExplanation(
		{
			templateId,
			normalizedKey,
			displayName: input.displayName,
			sampleCount: input.sampleCount,
			location: input.location,
			purchasedAt: input.purchasedAt,
			typicalDays: input.typicalDays ?? undefined
		},
		locale
	);

	if (input.purchasedAt && templateId === 'shelf_life.household') {
		const purchasedFact = translate(locale, 'learning.explain.shelfLife.householdFactPurchased', {
			date: input.purchasedAt
		});
		if (!explanation.facts.includes(purchasedFact)) {
			return { ...explanation, facts: [...explanation.facts, purchasedFact] };
		}
	}

	return explanation;
}

export function buildLocationExplanationFromSource(
	locale: Locale,
	input: LocationExplainInput
): PredictionExplanation | null {
	const normalizedKey = input.normalizedKey ?? normalizeReceiptProductName(input.productName ?? '');
	if (!normalizedKey) return null;

	if (isHouseholdSource(input.source)) {
		return buildLocationExplanation(
			{
				templateId: 'location.household',
				normalizedKey,
				displayName: input.productName,
				sampleCount: input.sampleCount,
				location: input.location
			},
			locale
		);
	}

	if (isHeuristicSource(input.source)) {
		return buildLocationExplanation(
			{
				templateId: 'location.heuristic',
				normalizedKey,
				displayName: input.productName,
				location: input.location
			},
			locale
		);
	}

	return null;
}

/** Renders explanation content for sheet display (filters empty facts). */
export function renderExplanationContent(explanation: PredictionExplanation): {
	primary: string;
	facts: string[];
	learnMore?: string;
} {
	return {
		primary: explanation.primary.trim(),
		facts: explanation.facts.map((fact) => fact.trim()).filter(Boolean),
		learnMore: explanation.learnMore?.trim() || undefined
	};
}

export function buildInventoryShelfLifeExplanation(
	input: Omit<ShelfLifeExplainInput, 'normalizedKey'> & { productName: string },
	locale: Locale = DEFAULT_LOCALE
): PredictionExplanation | null {
	return buildShelfLifeExplanationFromSource(locale, {
		...input,
		displayName: input.productName,
		normalizedKey: normalizeReceiptProductName(input.productName)
	});
}
