import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';

import { buildShelfLifeExplanationFromSource } from '$lib/domain/learning/prediction-explain';

import type { ReceiptLine, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

import { DEFAULT_LOCALE } from '$lib/i18n/locale';



export async function predictReceiptLinesShelfLife(

	householdId: string,

	lines: ReceiptLine[],

	purchasedAt: string | null,

	learningEngine: LearningEngineService

): Promise<(ReceiptShelfLifePrediction | null)[]> {

	return Promise.all(

		lines.map(async (line) => {

			const normalizedKey = normalizeReceiptProductName(line.name);

			if (!normalizedKey) return null;



			const prediction = await learningEngine.predictShelfLife(householdId, {

				productName: line.name,

				normalizedKey,

				location: line.location,

				purchasedAt

			});

			if (!prediction) return null;



			const explanation =

				prediction.explanation ??

				buildShelfLifeExplanationFromSource(DEFAULT_LOCALE, {

					source: prediction.source,

					typicalDays: prediction.typicalDays,

					location: line.location,

					purchasedAt,

					displayName: line.name,

					normalizedKey

				});



			return {

				expiresOn: prediction.expiresOn,

				typicalDays: prediction.typicalDays,

				expiresOnSource: prediction.expiresOnSource,

				modelVersion: prediction.modelVersion,

				explanation: explanation ?? undefined

			};

		})

	);

}


