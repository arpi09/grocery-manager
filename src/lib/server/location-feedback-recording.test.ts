import { describe, expect, it, vi } from 'vitest';
import type { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import {
	readLineLocationPrediction,
	recordInventoryEditLocationFeedback,
	recordLineLocationFeedback
} from './location-feedback-recording';

vi.mock('$lib/server/location-learning-flag', () => ({
	isLocationLearningEnabled: () => true
}));

describe('location-feedback-recording', () => {
	it('reads predicted location from form data', () => {
		const formData = new FormData();
		formData.set('predictedLocation_0', 'fridge');
		formData.set('predictedLocationModelVersion_0', 'heuristic-v1');

		expect(readLineLocationPrediction(formData, 0)).toEqual({
			predictedLocation: 'fridge',
			modelVersion: 'heuristic-v1'
		});
	});

	it('records corrected location feedback when actual differs from prediction', async () => {
		const recordLocationFeedback = vi.fn().mockResolvedValue(undefined);
		const learningEngine = { recordLocationFeedback } as unknown as LearningEngineService;

		await recordLineLocationFeedback({
			learningEngine,
			householdId: 'house-1',
			userId: 'user-1',
			productName: 'Pasta Spaghetti',
			prediction: {
				predictedLocation: 'cupboard',
				modelVersion: 'heuristic-v1'
			},
			actualLocation: 'fridge'
		});

		expect(recordLocationFeedback).toHaveBeenCalledWith({
			householdId: 'house-1',
			userId: 'user-1',
			normalizedKey: 'pasta spaghetti',
			context: { productName: 'Pasta Spaghetti', storeLabel: null },
			predictedLocation: 'cupboard',
			actualLocation: 'fridge',
			feedbackType: 'corrected',
			modelVersion: 'heuristic-v1'
		});
	});

	it('records accepted feedback when actual matches prediction', async () => {
		const recordLocationFeedback = vi.fn().mockResolvedValue(undefined);
		const learningEngine = { recordLocationFeedback } as unknown as LearningEngineService;

		await recordLineLocationFeedback({
			learningEngine,
			householdId: 'house-1',
			userId: 'user-1',
			productName: 'Mjölk 3%',
			prediction: {
				predictedLocation: 'fridge',
				modelVersion: 'household-v1'
			},
			actualLocation: 'fridge'
		});

		expect(recordLocationFeedback).toHaveBeenCalledWith(
			expect.objectContaining({
				feedbackType: 'accepted'
			})
		);
	});

	it('skips recording when prediction is missing', async () => {
		const recordLocationFeedback = vi.fn().mockResolvedValue(undefined);
		const learningEngine = { recordLocationFeedback } as unknown as LearningEngineService;

		await recordLineLocationFeedback({
			learningEngine,
			householdId: 'house-1',
			userId: 'user-1',
			productName: 'Ost',
			prediction: {
				predictedLocation: null,
				modelVersion: null
			},
			actualLocation: 'fridge'
		});

		expect(recordLocationFeedback).not.toHaveBeenCalled();
	});

	it('records inventory edit location feedback when location changes', async () => {
		const recordLocationFeedback = vi.fn().mockResolvedValue(undefined);
		const learningEngine = { recordLocationFeedback } as unknown as LearningEngineService;

		await recordInventoryEditLocationFeedback({
			learningEngine,
			householdId: 'house-1',
			userId: 'user-1',
			productName: 'Pasta Spaghetti',
			previousLocation: 'cupboard',
			newLocation: 'fridge'
		});

		expect(recordLocationFeedback).toHaveBeenCalledWith({
			householdId: 'house-1',
			userId: 'user-1',
			normalizedKey: 'pasta spaghetti',
			context: { productName: 'Pasta Spaghetti', storeLabel: null },
			predictedLocation: 'cupboard',
			actualLocation: 'fridge',
			feedbackType: 'corrected',
			modelVersion: 'inventory-edit'
		});
	});

	it('skips inventory edit feedback when location is unchanged', async () => {
		const recordLocationFeedback = vi.fn().mockResolvedValue(undefined);
		const learningEngine = { recordLocationFeedback } as unknown as LearningEngineService;

		await recordInventoryEditLocationFeedback({
			learningEngine,
			householdId: 'house-1',
			userId: 'user-1',
			productName: 'Mjölk 3%',
			previousLocation: 'fridge',
			newLocation: 'fridge'
		});

		expect(recordLocationFeedback).not.toHaveBeenCalled();
	});
});
