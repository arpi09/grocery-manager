import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/infrastructure/db/schema';
import { LearningEngineService } from './learning-engine.service';
import { HouseholdLearningAdapter } from '$lib/infrastructure/adapters/household-learning.adapter';
import { LearningFeedbackAdapter } from '$lib/infrastructure/adapters/learning-feedback.adapter';
import { DrizzleHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { DrizzleHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import { DrizzleLearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';

const HOUSEHOLD_ID = 'house-learning';
const USER_ID = 'user-learning';

describe('Learning engine integration', () => {
	let client: PGlite;
	let service: LearningEngineService;
	let replenishmentService: LearningEngineService;

	beforeAll(async () => {
		client = new PGlite();
		await client.exec(`
			CREATE TABLE IF NOT EXISTS "user" (
				"id" text PRIMARY KEY NOT NULL,
				"email" text NOT NULL,
				"password_hash" text,
				"role" text NOT NULL DEFAULT 'user',
				"created_at" timestamp with time zone NOT NULL DEFAULT now()
			);
			CREATE TABLE IF NOT EXISTS "household" (
				"id" text PRIMARY KEY NOT NULL,
				"name" text NOT NULL,
				"created_at" timestamp with time zone NOT NULL DEFAULT now()
			);
		`);
		for (const file of ['0047_learning_engine_v1.sql', '0048_household_location_rule.sql']) {
			const migrationSql = readFileSync(join(process.cwd(), 'drizzle', file), 'utf8');
			await client.exec(migrationSql);
		}
		await client.exec(`
			INSERT INTO "user" (id, email) VALUES ('${USER_ID}', 'user@example.com');
			INSERT INTO "household" (id, name) VALUES ('${HOUSEHOLD_ID}', 'Test household');
		`);

		const db = drizzle({ client, schema });
		const householdLearning = new HouseholdLearningAdapter(
			new DrizzleHouseholdShelfLifeRuleRepository(db),
			new DrizzleHouseholdLocationRuleRepository(db)
		);
		const learningFeedback = new LearningFeedbackAdapter(new DrizzleLearningFeedbackRepository(db));
		service = new LearningEngineService(householdLearning, learningFeedback, {
			learningEnabled: () => true,
			locationLearningEnabled: () => true,
			todayIso: () => '2026-06-01'
		});
		replenishmentService = new LearningEngineService(householdLearning, learningFeedback, {
			replenishmentLearningEnabled: () => true
		});
	}, 30_000);

	beforeEach(async () => {
		await client.exec(`
			TRUNCATE TABLE "learning_feedback", "household_shelf_life_rule", "household_location_rule" RESTART IDENTITY CASCADE;
		`);
	});

	afterAll(async () => {
		await client.close();
	});

	it('persists feedback and household rule then predicts shelf life with learned source', async () => {
		const first = await service.predictShelfLife(HOUSEHOLD_ID, {
			productName: 'Mjölk 3%',
			normalizedKey: 'mjolk 3',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});
		expect(first).not.toBeNull();
		expect(first!.source).toBe('heuristic');
		expect(first!.expiresOnSource).toBe('heuristic');

		await service.recordFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			normalizedKey: 'mjolk 3',
			context: { location: 'fridge', purchasedAt: '2026-06-01' },
			predictedExpiresOn: first!.expiresOn,
			predictedTypicalDays: first!.typicalDays,
			actualExpiresOn: '2026-06-12',
			feedbackType: 'corrected',
			modelVersion: first!.modelVersion
		});

		await service.recordFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			normalizedKey: 'mjolk 3',
			context: { location: 'fridge', purchasedAt: '2026-06-08' },
			predictedExpiresOn: '2026-06-15',
			predictedTypicalDays: 7,
			actualExpiresOn: '2026-06-15',
			feedbackType: 'accepted',
			modelVersion: 'heuristic-v1'
		});

		const rows = await client.query<{
			typical_days: number;
			sample_count: number;
		}>(
			`SELECT typical_days, sample_count FROM household_shelf_life_rule
			 WHERE household_id = '${HOUSEHOLD_ID}' AND normalized_key = 'mjolk 3'`
		);
		expect(rows.rows[0]?.sample_count).toBe(2);

		const learned = await service.predictShelfLife(HOUSEHOLD_ID, {
			productName: 'Mjölk 3%',
			normalizedKey: 'mjolk 3',
			location: 'fridge',
			purchasedAt: '2026-06-01'
		});
		expect(learned?.source).toBe('household_rule');
		expect(learned?.expiresOnSource).toBe('household_learned');
	});

	it('persists location feedback and household rule then predicts location with learned source', async () => {
		const first = await service.predictLocation(HOUSEHOLD_ID, {
			productName: 'Pasta Spaghetti',
			normalizedKey: 'pasta spaghetti'
		});
		expect(first?.source).toBe('heuristic');

		await service.recordLocationFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			normalizedKey: 'pasta spaghetti',
			context: { productName: 'Pasta Spaghetti' },
			predictedLocation: first!.location,
			actualLocation: 'fridge',
			feedbackType: 'corrected',
			modelVersion: first!.modelVersion
		});

		await service.recordLocationFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			normalizedKey: 'pasta spaghetti',
			context: { productName: 'Pasta Spaghetti' },
			predictedLocation: 'fridge',
			actualLocation: 'fridge',
			feedbackType: 'accepted',
			modelVersion: 'heuristic-v1'
		});

		const rows = await client.query<{ location: string; sample_count: number }>(
			`SELECT location, sample_count FROM household_location_rule
			 WHERE household_id = '${HOUSEHOLD_ID}' AND normalized_key = 'pasta spaghetti'`
		);
		expect(rows.rows[0]?.sample_count).toBe(2);
		expect(rows.rows[0]?.location).toBe('fridge');

		const learned = await service.predictLocation(HOUSEHOLD_ID, {
			productName: 'Pasta Spaghetti',
			normalizedKey: 'pasta spaghetti'
		});
		expect(learned?.source).toBe('household_rule');
		expect(learned?.location).toBe('fridge');
	});

	it('persists replenishment accepted and ignored feedback when flag is enabled', async () => {
		await replenishmentService.recordPredictorFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			predictorId: 'replenishment',
			normalizedKey: 'mjolk 1l',
			feedbackType: 'accepted',
			predictedValue: 'mjolk 1l',
			actualValue: 'Arla Mjölk 1L',
			contextJson: { displayName: 'Arla Mjölk 1L' }
		});

		await replenishmentService.recordPredictorFeedback({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			predictorId: 'replenishment',
			normalizedKey: 'ris basmati',
			feedbackType: 'ignored',
			predictedValue: 'ris basmati'
		});

		const rows = await client.query<{
			predictor_id: string;
			subject_key: string;
			feedback_type: string;
		}>(
			`SELECT predictor_id, subject_key, feedback_type FROM learning_feedback
			 WHERE household_id = '${HOUSEHOLD_ID}' AND predictor_id = 'replenishment'
			 ORDER BY subject_key`
		);
		expect(rows.rows).toHaveLength(2);
		expect(rows.rows[0]).toMatchObject({
			subject_key: 'mjolk 1l',
			feedback_type: 'accepted'
		});
		expect(rows.rows[1]).toMatchObject({
			subject_key: 'ris basmati',
			feedback_type: 'ignored'
		});
	});
});
