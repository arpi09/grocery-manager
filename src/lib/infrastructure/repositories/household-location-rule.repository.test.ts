import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/infrastructure/db/schema';
import { DrizzleHouseholdLocationRuleRepository } from './household-location-rule.repository';

const HOUSEHOLD_ID = 'house-location';

describe('DrizzleHouseholdLocationRuleRepository', () => {
	let client: PGlite;
	let repository: DrizzleHouseholdLocationRuleRepository;

	beforeAll(async () => {
		client = new PGlite();
		await client.exec(`
			CREATE TABLE IF NOT EXISTS "household" (
				"id" text PRIMARY KEY NOT NULL,
				"name" text NOT NULL,
				"created_at" timestamp with time zone NOT NULL DEFAULT now()
			);
		`);
		const migrationSql = readFileSync(
			join(process.cwd(), 'drizzle', '0048_household_location_rule.sql'),
			'utf8'
		);
		await client.exec(migrationSql);
		await client.exec(`INSERT INTO "household" (id, name) VALUES ('${HOUSEHOLD_ID}', 'Test');`);
		const db = drizzle({ client, schema });
		repository = new DrizzleHouseholdLocationRuleRepository(db);
	}, 30_000);

	beforeEach(async () => {
		await client.exec(`TRUNCATE TABLE "household_location_rule" RESTART IDENTITY CASCADE;`);
	});

	afterAll(async () => {
		await client.close();
	});

	it('upserts and finds a location rule by normalized key', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'mjolk 3',
			location: 'fridge',
			sampleCount: 2
		});

		const found = await repository.findByKey(HOUSEHOLD_ID, 'mjolk 3');
		expect(found).toMatchObject({
			location: 'fridge',
			sampleCount: 2
		});
	});

	it('updates location on conflict', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'pasta',
			location: 'cupboard',
			sampleCount: 2
		});
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'pasta',
			location: 'fridge',
			sampleCount: 3
		});

		const found = await repository.findByKey(HOUSEHOLD_ID, 'pasta');
		expect(found?.location).toBe('fridge');
		expect(found?.sampleCount).toBe(3);
	});

	it('lists rules with minimum sample count and deletes by key', async () => {
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'yoghurt',
			location: 'fridge',
			sampleCount: 0
		});
		await repository.upsert({
			householdId: HOUSEHOLD_ID,
			normalizedKey: 'pasta',
			location: 'cupboard',
			sampleCount: 2
		});

		const listed = await repository.listByHousehold(HOUSEHOLD_ID, 1);
		expect(listed).toHaveLength(1);
		expect(listed[0]?.normalizedKey).toBe('pasta');

		const deleted = await repository.delete(HOUSEHOLD_ID, 'pasta');
		expect(deleted).toBe(true);
		expect(await repository.findByKey(HOUSEHOLD_ID, 'pasta')).toBeNull();
	});
});
