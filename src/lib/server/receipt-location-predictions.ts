import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';

import { buildLocationExplanationFromSource } from '$lib/domain/learning/prediction-explain';

import type { ReceiptLine, ReceiptLocationPrediction } from '$lib/domain/receipt-line';

import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

import { DEFAULT_LOCALE } from '$lib/i18n/locale';



export async function predictReceiptLinesLocation(

	householdId: string,

	lines: ReceiptLine[],

	learningEngine: LearningEngineService

): Promise<(ReceiptLocationPrediction | null)[]> {

	return Promise.all(

		lines.map(async (line) => {

			const normalizedKey = normalizeReceiptProductName(line.name);

			if (!normalizedKey) return null;



			const prediction = await learningEngine.predictLocation(householdId, {

				productName: line.name,

				normalizedKey

			});

			if (!prediction) return null;



			const explanation =

				prediction.explanation ??

				buildLocationExplanationFromSource(DEFAULT_LOCALE, {

					source: prediction.source,

					location: prediction.location,

					productName: line.name,

					normalizedKey

				});



			return {

				location: prediction.location,

				source: prediction.source,

				modelVersion: prediction.modelVersion,

				explanation: explanation ?? undefined

			};

		})

	);

}


