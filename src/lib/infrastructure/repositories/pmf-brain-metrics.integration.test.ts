import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { generateId } from '$lib/infrastructure/auth/id';
import { learningFeedbackTable, productEventTable } from '$lib/infrastructure/db/schema';

const { dbState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null }
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

describe('PmfRepository brain metrics', () => {
	let integrationDb: IntegrationDbContext;
	const repository = new DrizzlePmfRepository();
	const now = new Date('2026-06-10T12:00:00Z');
	const since = new Date('2026-06-03T12:00:00Z');

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
		dbState.db = null;
	});

	it('aggregates receipt funnel, quick confirm, and learning corrections', async () => {
		const userId = generateId();
		const householdId = generateId();
		await integrationDb.seedUser({ id: userId, email: `brain-${userId}@example.com` });
		await integrationDb.seedHousehold({
			id: householdId,
			members: [{ userId, role: 'owner' }]
		});

		await integrationDb.db.insert(productEventTable).values([
			{
				id: generateId(),
				userId,
				householdId,
				eventType: 'receipt_import_started',
				metadata: null,
				createdAt: new Date('2026-06-05T10:00:00Z')
			},
			{
				id: generateId(),
				userId,
				householdId,
				eventType: 'receipt_review_completed',
				metadata: JSON.stringify({ quickConfirm: true }),
				createdAt: new Date('2026-06-05T10:04:00Z')
			},
			{
				id: generateId(),
				userId,
				householdId,
				eventType: 'receipt_parsed',
				metadata: JSON.stringify({ bbfCoveragePercent: 80, aiBatchUsed: true }),
				createdAt: new Date('2026-06-05T10:02:00Z')
			},
			{
				id: generateId(),
				userId,
				householdId,
				eventType: 'brain_explanation_viewed',
				metadata: null,
				createdAt: new Date('2026-06-06T10:00:00Z')
			}
		]);

		await integrationDb.db.insert(learningFeedbackTable).values({
			id: generateId(),
			householdId,
			userId,
			predictorId: 'shelf_life',
			subjectKey: 'mjolk',
			contextJson: { productName: 'Mjölk' },
			predictedValue: '2026-06-20',
			actualValue: '2026-06-18',
			feedbackType: 'corrected',
			modelVersion: 'heuristic-v1',
			createdAt: new Date('2026-06-06T11:00:00Z')
		});

		const metrics = await repository.getBrainMetricsSince(since, now);

		expect(metrics.receiptParseCount).toBe(1);
		expect(metrics.avgBbfCoveragePercent).toBe(80);
		expect(metrics.aiBatchUsedCount).toBe(1);
		expect(metrics.funnelCounts.receipt_review_completed).toBe(1);
		expect(metrics.quickConfirmCount).toBe(1);
		expect(metrics.timeToReviewMinutes).toEqual([4]);
		expect(metrics.brainExplanationViewed).toBe(1);
		expect(metrics.correctionBySource).toEqual([
			{ source: 'heuristic', corrected: 1, accepted: 0 }
		]);
		expect(metrics.topCorrectedProducts[0]?.productName).toBe('Mjölk');
	});
});
