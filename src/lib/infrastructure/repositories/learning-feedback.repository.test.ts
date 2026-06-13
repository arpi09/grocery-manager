import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '$lib/infrastructure/db/schema';
import { DrizzleLearningFeedbackRepository } from './learning-feedback.repository';

const HOUSEHOLD_ID = 'house-test';
const USER_ID = 'user-test';

describe('DrizzleLearningFeedbackRepository', () => {
	let client: PGlite;
	let repository: DrizzleLearningFeedbackRepository;

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
		const migrationSql = readFileSync(
			join(process.cwd(), 'drizzle', '0047_learning_engine_v1.sql'),
			'utf8'
		);
		await client.exec(migrationSql);
		await client.exec(`
			INSERT INTO "user" (id, email) VALUES ('${USER_ID}', 'user@example.com');
			INSERT INTO "household" (id, name) VALUES ('${HOUSEHOLD_ID}', 'Test household');
		`);
		const db = drizzle({ client, schema });
		repository = new DrizzleLearningFeedbackRepository(db);
	}, 30_000);

	beforeEach(async () => {
		await client.exec('TRUNCATE TABLE "learning_feedback" RESTART IDENTITY CASCADE;');
	});

	afterAll(async () => {
		await client.close();
	});

	it('inserts feedback with context json', async () => {
		const record = await repository.insert({
			householdId: HOUSEHOLD_ID,
			userId: USER_ID,
			predictorId: 'shelf_life',
			subjectKey: 'mjolk',
			contextJson: { location: 'fridge', purchasedAt: '2026-06-01' },
			predictedValue: '2026-06-08',
			actualValue: '2026-06-10',
			feedbackType: 'corrected',
			modelVersion: 'heuristic-v1'
		});

		expect(record.id).toBeTruthy();
		expect(record.contextJson).toEqual({ location: 'fridge', purchasedAt: '2026-06-01' });
		expect(record.feedbackType).toBe('corrected');
		expect(record.createdAt).toBeInstanceOf(Date);
	});

	it('lists feedback by household and predictor ordered by created_at desc', async () => {
		await client.exec(`
			INSERT INTO "learning_feedback" (
				id, household_id, user_id, predictor_id, subject_key,
				context_json, predicted_value, actual_value, feedback_type, model_version, created_at
			) VALUES
				(
					'fb-old', '${HOUSEHOLD_ID}', '${USER_ID}', 'shelf_life', 'mjolk',
					'{}', '2026-06-08', '2026-06-08', 'accepted', 'heuristic-v1',
					'2026-06-01T10:00:00Z'
				),
				(
					'fb-new', '${HOUSEHOLD_ID}', '${USER_ID}', 'shelf_life', 'brod',
					'{}', '2026-06-15', NULL, 'rejected', 'household-v1',
					'2026-06-10T10:00:00Z'
				),
				(
					'fb-other', '${HOUSEHOLD_ID}', '${USER_ID}', 'location', 'mjolk',
					'{}', 'fridge', 'freezer', 'corrected', 'heuristic-v1',
					'2026-06-11T10:00:00Z'
				);
		`);

		const rows = await repository.listByHouseholdAndPredictor(HOUSEHOLD_ID, 'shelf_life');

		expect(rows).toHaveLength(2);
		expect(rows[0].subjectKey).toBe('brod');
		expect(rows[1].subjectKey).toBe('mjolk');
	});

	it('filters feedback by since date', async () => {
		await client.exec(`
			INSERT INTO "learning_feedback" (
				id, household_id, user_id, predictor_id, subject_key,
				context_json, predicted_value, feedback_type, model_version, created_at
			) VALUES
				(
					'fb-1', '${HOUSEHOLD_ID}', '${USER_ID}', 'shelf_life', 'a',
					'{}', '2026-06-01', 'accepted', 'heuristic-v1', '2026-06-01T10:00:00Z'
				),
				(
					'fb-2', '${HOUSEHOLD_ID}', '${USER_ID}', 'shelf_life', 'b',
					'{}', '2026-06-15', 'accepted', 'heuristic-v1', '2026-06-15T10:00:00Z'
				);
		`);

		const rows = await repository.listByHouseholdAndPredictor(HOUSEHOLD_ID, 'shelf_life', {
			since: new Date('2026-06-10T00:00:00Z')
		});

		expect(rows).toHaveLength(1);
		expect(rows[0].subjectKey).toBe('b');
	});
});
