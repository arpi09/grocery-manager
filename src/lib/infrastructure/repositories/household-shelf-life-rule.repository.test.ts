import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '$lib/infrastructure/db/schema';
import { DrizzleHouseholdShelfLifeRuleRepository } from './household-shelf-life-rule.repository';

const HOUSEHOLD_ID = 'house-test';
const USER_ID = 'user-test';

describe('DrizzleHouseholdShelfLifeRuleRepository', () => {
	let client: PGlite;
	let repository: DrizzleHouseholdShelfLifeRuleRepository;

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
		repository = new DrizzleHouseholdShelfLifeRuleRepository(db);
	}, 30_000);

	beforeEach(async () => {
		await client.exec('TRUNCATE TABLE "household_shelf_life_rule" RESTART IDENTITY CASCADE;');
	});

	afterAll(async () => {
		await client.close();
	});

	it('returns null when no rule exists', async () => {
		const rule = await repository.findByKey(HOUSEHOLD_ID, 'mjolk', 'fridge');
		expect(rule).toBeNull();
	});

	it('inserts and retrieves a household shelf-life rule', async () => {
		const saved = await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjolk',
			location: 'fridge',
			typicalDays: 7,
			sampleCount: 2,
			lastPredictedDays: 7
		});

		expect(saved).toMatchObject({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjolk',
			location: 'fridge',
			typicalDays: 7,
			sampleCount: 2,
			lastPredictedDays: 7
		});
		expect(saved.updatedAt).toBeInstanceOf(Date);

		const found = await repository.findByKey(HOUSEHOLD_ID, 'mjolk', 'fridge');
		expect(found).toEqual(saved);
	});

	it('updates an existing rule on conflict', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'brod',
			location: 'cupboard',
			typicalDays: 5,
			sampleCount: 1,
			lastPredictedDays: 5
		});

		const updated = await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'brod',
			location: 'cupboard',
			typicalDays: 4,
			sampleCount: 3,
			lastPredictedDays: 5
		});

		expect(updated.typicalDays).toBe(4);
		expect(updated.sampleCount).toBe(3);

		const found = await repository.findByKey(HOUSEHOLD_ID, 'brod', 'cupboard');
		expect(found?.typicalDays).toBe(4);
		expect(found?.sampleCount).toBe(3);
	});

	it('lists rules with minimum sample count and deletes by key', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjolk',
			location: 'fridge',
			typicalDays: 7,
			sampleCount: 0,
			lastPredictedDays: 7
		});
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'brod',
			location: 'cupboard',
			typicalDays: 4,
			sampleCount: 2,
			lastPredictedDays: 4
		});

		const listed = await repository.listByHousehold(HOUSEHOLD_ID, 1);
		expect(listed).toHaveLength(1);
		expect(listed[0]?.normalizedKey).toBe('brod');

		const deleted = await repository.delete(HOUSEHOLD_ID, 'brod', 'cupboard');
		expect(deleted).toBe(true);
		expect(await repository.findByKey(HOUSEHOLD_ID, 'brod', 'cupboard')).toBeNull();
	});
});
