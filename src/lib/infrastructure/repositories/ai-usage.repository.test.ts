import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '$lib/infrastructure/db/schema';
import { DrizzleAiUsageRepository } from './ai-usage.repository';

const NOW = new Date('2026-05-30T12:00:00Z');
const WITHIN_WINDOW = new Date('2026-05-20T12:00:00Z');
const OUTSIDE_WINDOW = new Date('2026-04-01T12:00:00Z');
const MONTH_START = new Date(Date.UTC(2026, 4, 1));

describe('DrizzleAiUsageRepository.getAdminSummary', () => {
	let client: PGlite;
	let repository: DrizzleAiUsageRepository;

	beforeAll(async () => {
		client = new PGlite();
		const migrationSql = readFileSync(
			join(process.cwd(), 'drizzle', '0015_ai_usage.sql'),
			'utf8'
		);
		await client.exec(migrationSql);
		await client.exec(`
			CREATE TABLE IF NOT EXISTS "user" (
				"id" text PRIMARY KEY NOT NULL,
				"email" text NOT NULL,
				"password_hash" text NOT NULL,
				"role" text NOT NULL DEFAULT 'user',
				"created_at" timestamp with time zone NOT NULL DEFAULT now()
			);
		`);
		const db = drizzle({ client, schema });
		repository = new DrizzleAiUsageRepository(db);

		await client.exec(`
			INSERT INTO "user" (id, email, password_hash, role, created_at)
			VALUES
				('user-1', 'user-1@example.com', 'hash', 'user', '${NOW.toISOString()}'),
				('user-2', 'user-2@example.com', 'hash', 'user', '${NOW.toISOString()}');
		`);
	}, 30_000);

	beforeEach(async () => {
		await client.exec('TRUNCATE TABLE "ai_usage" RESTART IDENTITY CASCADE;');
	});

	afterAll(async () => {
		await client.close();
	});

	async function seedUsage(
		rows: Array<{
			id: string;
			scopeId: string;
			userId: string;
			kind: 'ai_scan' | 'receipt_pdf' | 'smart_fill';
			periodKey: string;
			count: number;
			updatedAt: Date;
		}>
	) {
		for (const row of rows) {
			await client.exec(`
				INSERT INTO "ai_usage" (id, scope_id, user_id, kind, period_key, count, updated_at)
				VALUES (
					'${row.id}',
					'${row.scopeId}',
					'${row.userId}',
					'${row.kind}',
					'${row.periodKey}',
					${row.count},
					'${row.updatedAt.toISOString()}'
				);
			`);
		}
	}

	it('aggregates usage by kind for the rolling window', async () => {
		await seedUsage([
			{
				id: 'u1',
				scopeId: 'house-a',
				userId: 'user-1',
				kind: 'ai_scan',
				periodKey: '2026-05',
				count: 4,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'u2',
				scopeId: 'house-a',
				userId: 'user-1',
				kind: 'receipt_pdf',
				periodKey: '2026-05',
				count: 2,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'u3',
				scopeId: 'user:user-2',
				userId: 'user-2',
				kind: 'smart_fill',
				periodKey: '2026-W22',
				count: 3,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'u4',
				scopeId: 'house-b',
				userId: 'user-1',
				kind: 'ai_scan',
				periodKey: '2026-04',
				count: 99,
				updatedAt: OUTSIDE_WINDOW
			}
		]);

		const summary = await repository.getAdminSummary({
			since: new Date(NOW.getTime() - 30 * 86_400_000),
			monthStart: MONTH_START,
			monthKey: '2026-05',
			topLimit: 5
		});

		expect(summary.byKind).toEqual({
			ai_scan: 4,
			receipt_pdf: 2,
			smart_fill: 3
		});
		expect(summary.monthlyByKind).toEqual({
			ai_scan: 4,
			receipt_pdf: 2,
			smart_fill: 3
		});
		expect(summary.monthlyTotal).toBe(9);
	});

	it('returns top household counts without identifiers and excludes user scopes', async () => {
		await seedUsage([
			{
				id: 'h1',
				scopeId: 'house-heavy',
				userId: 'user-1',
				kind: 'ai_scan',
				periodKey: '2026-05',
				count: 10,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'h2',
				scopeId: 'house-heavy',
				userId: 'user-1',
				kind: 'receipt_pdf',
				periodKey: '2026-05',
				count: 5,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'h3',
				scopeId: 'house-light',
				userId: 'user-2',
				kind: 'ai_scan',
				periodKey: '2026-05',
				count: 3,
				updatedAt: WITHIN_WINDOW
			},
			{
				id: 'h4',
				scopeId: 'user:user-2',
				userId: 'user-2',
				kind: 'smart_fill',
				periodKey: '2026-W22',
				count: 50,
				updatedAt: WITHIN_WINDOW
			}
		]);

		const summary = await repository.getAdminSummary({
			since: new Date(NOW.getTime() - 30 * 86_400_000),
			monthStart: MONTH_START,
			monthKey: '2026-05',
			topLimit: 5
		});

		expect(summary.topHouseholdCounts).toEqual([15, 3]);
		expect(summary.topHouseholdCounts.every((value) => typeof value === 'number')).toBe(true);
	});

	it('respects a shorter rolling window for byKind totals', async () => {
		const sevenDaysAgo = new Date(NOW.getTime() - 7 * 86_400_000);
		const eightDaysAgo = new Date(NOW.getTime() - 8 * 86_400_000);

		await seedUsage([
			{
				id: 'recent',
				scopeId: 'house-recent',
				userId: 'user-1',
				kind: 'ai_scan',
				periodKey: '2026-05',
				count: 4,
				updatedAt: sevenDaysAgo
			},
			{
				id: 'old',
				scopeId: 'house-old',
				userId: 'user-1',
				kind: 'ai_scan',
				periodKey: '2026-05',
				count: 99,
				updatedAt: eightDaysAgo
			}
		]);

		const summary = await repository.getAdminSummary({
			since: new Date(NOW.getTime() - 7 * 86_400_000),
			monthStart: MONTH_START,
			monthKey: '2026-05',
			topLimit: 5,
			periodDays: 7
		});

		expect(summary.byKind.ai_scan).toBe(4);
		expect(summary.periodDays).toBe(7);
	});
});
