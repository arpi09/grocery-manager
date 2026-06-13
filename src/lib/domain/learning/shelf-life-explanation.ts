import type { StorageLocation } from '$lib/domain/location';
import { locationLabel } from '$lib/i18n/domain-labels';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';
import type { PredictionExplanation, ProvenanceMeta } from './prediction-trust';

export type ShelfLifeExplanationTemplateId =
	| 'shelf_life.household'
	| 'shelf_life.heuristic'
	| 'shelf_life.llm';

export interface ShelfLifeExplanationMeta extends ProvenanceMeta {
	templateId: ShelfLifeExplanationTemplateId;
	typicalDays?: number;
}

function resolveLocationLabel(locale: Locale, location: string | undefined): string | undefined {
	if (!location) return undefined;
	return locationLabel(locale, location as StorageLocation);
}

export function buildShelfLifeExplanation(
	meta: ShelfLifeExplanationMeta,
	locale: Locale = DEFAULT_LOCALE
): PredictionExplanation {
	const { templateId } = meta;
	const location = resolveLocationLabel(locale, meta.location);

	switch (templateId) {
		case 'shelf_life.household': {
			const primary = translate(locale, 'learning.shelfLife.household.primary', {
				days: meta.typicalDays ?? 0
			});
			const facts: string[] = [];
			if (meta.sampleCount != null && location) {
				facts.push(
					translate(locale, 'learning.shelfLife.household.factCount', {
						count: meta.sampleCount,
						location
					})
				);
			}
			if (meta.lastUpdatedAt) {
				facts.push(
					translate(locale, 'learning.shelfLife.household.factUpdated', {
						date: meta.lastUpdatedAt
					})
				);
			}
			return { primary, facts, templateId };
		}
		case 'shelf_life.heuristic': {
			const primary = translate(locale, 'learning.shelfLife.heuristic.primary');
			const facts: string[] = [];
			if (location) {
				facts.push(
					translate(locale, 'learning.shelfLife.heuristic.factLocation', { location })
				);
			}
			return { primary, facts, templateId };
		}
		case 'shelf_life.llm': {
			return {
				primary: translate(locale, 'learning.shelfLife.llm.primary'),
				facts: [translate(locale, 'learning.shelfLife.llm.factCheck')],
				templateId
			};
		}
	}
}
