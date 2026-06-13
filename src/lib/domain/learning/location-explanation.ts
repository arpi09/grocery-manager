import type { StorageLocation } from '$lib/domain/location';

import { locationLabel } from '$lib/i18n/domain-labels';

import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';

import { translate } from '$lib/i18n/messages';

import type { PredictionExplanation, ProvenanceMeta } from './prediction-trust';



export type LocationExplanationTemplateId = 'location.household' | 'location.heuristic';



export interface LocationExplanationMeta extends ProvenanceMeta {

	templateId: LocationExplanationTemplateId;

	location: StorageLocation;

}



export function buildLocationExplanation(

	meta: LocationExplanationMeta,

	locale: Locale = DEFAULT_LOCALE

): PredictionExplanation {

	const { templateId } = meta;

	const location = locationLabel(locale, meta.location);

	const product =

		meta.displayName?.trim() || translate(locale, 'learning.explain.productFallback');



	switch (templateId) {

		case 'location.household': {

			const facts: string[] = [];

			if (meta.sampleCount != null && meta.sampleCount > 0) {

				facts.push(

					translate(locale, 'learning.location.household.factCount', {

						count: meta.sampleCount

					})

				);

			}

			return {

				primary: translate(locale, 'learning.location.household.primary', { product, location }),

				facts,

				templateId

			};

		}

		case 'location.heuristic':

			return {

				primary: translate(locale, 'learning.location.heuristic.primary', { location }),

				facts: [translate(locale, 'learning.location.heuristic.fact')],

				templateId

			};

	}

}


