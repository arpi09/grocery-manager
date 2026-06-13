import { describe, expect, it, vi } from 'vitest';

import { LearningEngineService } from './learning-engine.service';

import type { HouseholdLearningPort } from './ports/household-learning.port';

import type { LearningFeedbackPort } from './ports/learning-feedback.port';



function createInMemoryPorts() {

	const shelfLifeRules = new Map<string, { typicalDays: number; sampleCount: number }>();

	const locationRules = new Map<string, { location: 'fridge' | 'freezer' | 'cupboard'; sampleCount: number }>();

	const feedback: Array<Record<string, unknown>> = [];



	const householdLearning: HouseholdLearningPort = {

		findShelfLifeRule: vi.fn(async (householdId, normalizedKey, location) => {

			return shelfLifeRules.get(`${householdId}:${normalizedKey}:${location}`) ?? null;

		}),

		upsertShelfLifeRule: vi.fn(async (input) => {

			shelfLifeRules.set(`${input.householdId}:${input.normalizedKey}:${input.location}`, {

				typicalDays: input.typicalDays,

				sampleCount: input.sampleCount

			});

		}),

		findLocationRule: vi.fn(async (householdId, normalizedKey) => {

			return locationRules.get(`${householdId}:${normalizedKey}`) ?? null;

		}),

		upsertLocationRule: vi.fn(async (input) => {

			locationRules.set(`${input.householdId}:${input.normalizedKey}`, {

				location: input.location,

				sampleCount: input.sampleCount

			});

		})

	};



	const learningFeedback: LearningFeedbackPort = {

		insert: vi.fn(async (input) => {

			feedback.push(input);

		})

	};



	return { shelfLifeRules, locationRules, feedback, householdLearning, learningFeedback };

}



describe('LearningEngineService', () => {

	const householdId = 'house-1';

	const userId = 'user-1';



	it('predicts with heuristic when learning is disabled', async () => {

		const { householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			learningEnabled: () => false,

			todayIso: () => '2026-06-01'

		});



		const prediction = await service.predictShelfLife(householdId, {

			productName: 'Mjölk 3%',

			normalizedKey: 'mjolk 3',

			location: 'fridge',

			purchasedAt: '2026-06-01'

		});



		expect(prediction).toMatchObject({

			expiresOn: '2026-06-08',

			typicalDays: 7,

			expiresOnSource: 'heuristic',

			source: 'heuristic'

		});

	});



	it('learns from correction and uses household rule on next prediction', async () => {

		const { shelfLifeRules, feedback, householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			learningEnabled: () => true,

			todayIso: () => '2026-06-01'

		});



		const first = await service.predictShelfLife(householdId, {

			productName: 'Mjölk 3%',

			normalizedKey: 'mjolk 3',

			location: 'fridge',

			purchasedAt: '2026-06-01'

		});

		expect(first?.source).toBe('heuristic');



		await service.recordFeedback({

			householdId,

			userId,

			normalizedKey: 'mjolk 3',

			context: { location: 'fridge', purchasedAt: '2026-06-01', productName: 'Mjölk 3%' },

			predictedExpiresOn: first!.expiresOn,

			predictedTypicalDays: first!.typicalDays,

			actualExpiresOn: '2026-06-12',

			feedbackType: 'corrected',

			modelVersion: first!.modelVersion

		});



		await service.recordFeedback({

			householdId,

			userId,

			normalizedKey: 'mjolk 3',

			context: { location: 'fridge', purchasedAt: '2026-06-08', productName: 'Mjölk 3%' },

			predictedExpiresOn: '2026-06-15',

			predictedTypicalDays: 7,

			actualExpiresOn: '2026-06-15',

			feedbackType: 'accepted',

			modelVersion: 'heuristic-v1'

		});



		expect(feedback).toHaveLength(2);

		const rule = shelfLifeRules.get(`${householdId}:mjolk 3:fridge`);

		expect(rule?.sampleCount).toBe(2);



		const second = await service.predictShelfLife(householdId, {

			productName: 'Mjölk 3%',

			normalizedKey: 'mjolk 3',

			location: 'fridge',

			purchasedAt: '2026-06-01'

		});



		expect(second?.source).toBe('household_rule');

		expect(second?.expiresOnSource).toBe('household_learned');

	});



	it('does not update household rule on rejected feedback', async () => {

		const { shelfLifeRules, householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			learningEnabled: () => true,

			todayIso: () => '2026-06-01'

		});



		await service.recordFeedback({

			householdId,

			userId,

			normalizedKey: 'mjolk',

			context: { location: 'fridge', purchasedAt: '2026-06-01' },

			predictedExpiresOn: '2026-06-08',

			predictedTypicalDays: 7,

			actualExpiresOn: null,

			feedbackType: 'rejected',

			modelVersion: 'heuristic-v1'

		});



		expect(shelfLifeRules.size).toBe(0);

	});



	it('predicts location with heuristic when location learning is disabled', async () => {

		const { householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			locationLearningEnabled: () => false

		});



		const prediction = await service.predictLocation(householdId, {

			productName: 'Pasta Spaghetti',

			normalizedKey: 'pasta spaghetti'

		});



		expect(prediction).toMatchObject({

			location: 'cupboard',

			source: 'heuristic'

		});

	});



	it('learns location from correction and uses household rule on next prediction', async () => {

		const { locationRules, feedback, householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			locationLearningEnabled: () => true

		});



		const first = await service.predictLocation(householdId, {

			productName: 'Pasta Spaghetti',

			normalizedKey: 'pasta spaghetti'

		});

		expect(first?.source).toBe('heuristic');



		await service.recordLocationFeedback({

			householdId,

			userId,

			normalizedKey: 'pasta spaghetti',

			context: { productName: 'Pasta Spaghetti' },

			predictedLocation: first!.location,

			actualLocation: 'fridge',

			feedbackType: 'corrected',

			modelVersion: first!.modelVersion

		});



		await service.recordLocationFeedback({

			householdId,

			userId,

			normalizedKey: 'pasta spaghetti',

			context: { productName: 'Pasta Spaghetti' },

			predictedLocation: 'fridge',

			actualLocation: 'fridge',

			feedbackType: 'accepted',

			modelVersion: 'heuristic-v1'

		});



		expect(feedback.filter((row) => row.predictorId === 'location')).toHaveLength(2);

		const rule = locationRules.get(`${householdId}:pasta spaghetti`);

		expect(rule?.sampleCount).toBe(2);

		expect(rule?.location).toBe('fridge');



		const second = await service.predictLocation(householdId, {

			productName: 'Pasta Spaghetti',

			normalizedKey: 'pasta spaghetti'

		});

		expect(second?.source).toBe('household_rule');

		expect(second?.location).toBe('fridge');

	});



	it('records replenishment feedback when flag is enabled', async () => {

		const { feedback, householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			replenishmentLearningEnabled: () => true

		});



		await service.recordPredictorFeedback({

			householdId,

			userId,

			predictorId: 'replenishment',

			normalizedKey: 'mjolk 1l',

			feedbackType: 'accepted',

			predictedValue: 'mjolk 1l',

			actualValue: 'Arla Mjölk 1L',

			contextJson: { displayName: 'Arla Mjölk 1L', surface: 'inkop' }

		});



		expect(feedback).toHaveLength(1);

		expect(feedback[0]).toMatchObject({

			predictorId: 'replenishment',

			subjectKey: 'mjolk 1l',

			feedbackType: 'accepted',

			actualValue: 'Arla Mjölk 1L'

		});

	});



	it('skips replenishment feedback when flag is disabled', async () => {

		const { feedback, householdLearning, learningFeedback } = createInMemoryPorts();

		const service = new LearningEngineService(householdLearning, learningFeedback, {

			replenishmentLearningEnabled: () => false

		});



		await service.recordPredictorFeedback({

			householdId,

			userId,

			predictorId: 'replenishment',

			normalizedKey: 'mjolk 1l',

			feedbackType: 'ignored'

		});



		expect(feedback).toHaveLength(0);

	});

	it('materializes shelf-life rule on strong consumption velocity feedback', async () => {
		const { shelfLifeRules, feedback, householdLearning, learningFeedback } = createInMemoryPorts();
		const service = new LearningEngineService(householdLearning, learningFeedback, {
			learningEnabled: () => true,
			todayIso: () => '2026-06-13'
		});

		await service.recordConsumptionVelocityFeedback({
			householdId,
			userId,
			normalizedKey: 'mjölk 3',
			context: {
				location: 'fridge',
				purchasedAt: '2026-06-01',
				productName: 'Mjölk 3%',
				source: 'consumption_velocity'
			},
			predictedExpiresOn: '2026-06-10',
			predictedTypicalDays: 9,
			consumedAt: '2026-06-04',
			observedTypicalDays: 3,
			strength: 'strong',
			modelVersion: 'heuristic-v1'
		});

		expect(feedback).toHaveLength(1);
		expect(feedback[0]).toMatchObject({
			feedbackType: 'corrected',
			actualValue: '2026-06-04'
		});

		const rule = shelfLifeRules.get(`${householdId}:mjölk 3:fridge`);
		expect(rule).toEqual({ typicalDays: 3, sampleCount: 1 });
	});

	it('audits weak consumption velocity without materializing rule', async () => {
		const { shelfLifeRules, feedback, householdLearning, learningFeedback } = createInMemoryPorts();
		const service = new LearningEngineService(householdLearning, learningFeedback, {
			learningEnabled: () => true,
			todayIso: () => '2026-06-13'
		});

		await service.recordConsumptionVelocityFeedback({
			householdId,
			userId,
			normalizedKey: 'mjölk 3',
			context: {
				location: 'fridge',
				purchasedAt: '2026-06-01',
				productName: 'Mjölk 3%',
				source: 'consumption_velocity'
			},
			predictedExpiresOn: '2026-06-10',
			predictedTypicalDays: 9,
			consumedAt: '2026-06-12',
			observedTypicalDays: 11,
			strength: 'weak',
			modelVersion: 'heuristic-v1'
		});

		expect(feedback).toHaveLength(1);
		expect(feedback[0]).toMatchObject({ feedbackType: 'accepted' });
		expect(shelfLifeRules.size).toBe(0);
	});

});

