import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { learningFeedbackTable } from '$lib/infrastructure/db/schema';
import { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { HouseholdLearningAdapter } from '$lib/infrastructure/adapters/household-learning.adapter';
import { LearningFeedbackAdapter } from '$lib/infrastructure/adapters/learning-feedback.adapter';
import { DrizzleHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import { DrizzleHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { DrizzleLearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { recordLineLocationFeedback } from './location-feedback-recording';

const { dbState, locationLearningEnabled } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	locationLearningEnabled: { value: true }
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) {
				throw new Error('Integration db not initialized');
			}
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) {
			throw new Error('Integration db not initialized');
		}
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

vi.mock('$lib/server/location-learning-flag', () => ({
	isLocationLearningEnabled: () => locationLearningEnabled.value
}));

describe('location-feedback-recording integration', () => {
	let integrationDb: IntegrationDbContext;
	let learningEngineService: LearningEngineService;
	const householdId = 'household-location-feedback';
	const userId = 'user-location-feedback';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		const householdLearning = new HouseholdLearningAdapter(
			new DrizzleHouseholdShelfLifeRuleRepository(integrationDb.db),
			new DrizzleHouseholdLocationRuleRepository(integrationDb.db)
		);
		const learningFeedback = new LearningFeedbackAdapter(
			new DrizzleLearningFeedbackRepository(integrationDb.db)
		);
		learningEngineService = new LearningEngineService(householdLearning, learningFeedback, {
			locationLearningEnabled: () => locationLearningEnabled.value
		});
	}, 30_000);

	beforeEach(async () => {
		locationLearningEnabled.value = true;
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId, email: 'location@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Location feedback household',
			members: [{ userId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	it('persists corrected location feedback to learning_feedback', async () => {
		await recordLineLocationFeedback({
			learningEngine: learningEngineService,
			householdId,
			userId,
			productName: 'Pasta Spaghetti',
			prediction: {
				predictedLocation: 'cupboard',
				modelVersion: 'heuristic-v1'
			},
			actualLocation: 'fridge'
		});

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			predictorId: 'location',
			subjectKey: 'pasta spaghetti',
			feedbackType: 'corrected',
			predictedValue: 'cupboard',
			actualValue: 'fridge'
		});
	});

	it('skips persistence when location learning flag is off', async () => {
		locationLearningEnabled.value = false;

		await recordLineLocationFeedback({
			learningEngine: learningEngineService,
			householdId,
			userId,
			productName: 'Pasta Spaghetti',
			prediction: {
				predictedLocation: 'cupboard',
				modelVersion: 'heuristic-v1'
			},
			actualLocation: 'fridge'
		});

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(0);
	});
});
