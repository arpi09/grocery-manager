import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { learningFeedbackTable, receiptPatternDismissalTable } from '$lib/infrastructure/db/schema';
import { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { PmfService } from '$lib/application/pmf.service';
import { HouseholdLearningAdapter } from '$lib/infrastructure/adapters/household-learning.adapter';
import { LearningFeedbackAdapter } from '$lib/infrastructure/adapters/learning-feedback.adapter';
import { DrizzleHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import { DrizzleHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { DrizzleLearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { POST as postFeedback } from './+server';
import { POST as postRestore } from './restore/+server';

const { dbState, brainFeedbackEnabled, replenishmentLearningEnabled } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	brainFeedbackEnabled: { value: true },
	replenishmentLearningEnabled: { value: true }
}));

vi.mock('$lib/server/brain-feedback-flag', () => ({
	isBrainFeedbackV1Enabled: () => brainFeedbackEnabled.value
}));

vi.mock('$lib/server/feature-flags', () => ({
	isReplenishmentLearningEnabled: () => replenishmentLearningEnabled.value
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) throw new Error('Integration db not initialized');
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) throw new Error('Integration db not initialized');
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

describe('Brain feedback API integration', () => {
	let integrationDb: IntegrationDbContext;
	let learningEngineService: LearningEngineService;
	let pmfService: PmfService;
	const householdId = 'household-brain-feedback';
	const userId = 'user-brain-feedback';
	const normalizedKey = 'mjolk';

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
			replenishmentLearningEnabled: () => replenishmentLearningEnabled.value
		});
		pmfService = new PmfService(new DrizzlePmfRepository());
	}, 30_000);

	beforeEach(async () => {
		brainFeedbackEnabled.value = true;
		replenishmentLearningEnabled.value = true;
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId });
		await integrationDb.seedHousehold({
			id: householdId,
			members: [{ userId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	function apiLocals() {
		return {
			locale: 'sv' as const,
			user: { id: userId },
			householdId,
			householdRole: 'owner' as const,
			learningEngineService,
			pmfService
		};
	}

	it('records positive feedback without duplicate rows within 24h', async () => {
		const body = {
			predictorId: 'replenishment',
			subjectKey: normalizedKey,
			polarity: 'positive',
			surface: 'hem',
			reasonCode: 'cadence_overdue'
		};
		const request = () =>
			new Request('http://localhost/api/brain/feedback', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});

		const first = await postFeedback({ request: request(), locals: apiLocals() } as Parameters<
			typeof postFeedback
		>[0]);
		const second = await postFeedback({ request: request(), locals: apiLocals() } as Parameters<
			typeof postFeedback
		>[0]);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		const firstJson = await first.json();
		const secondJson = await second.json();
		expect(firstJson.duplicate).toBe(false);
		expect(secondJson.duplicate).toBe(true);

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			predictorId: 'replenishment',
			subjectKey: normalizedKey,
			feedbackType: 'accepted'
		});
	});

	it('restores hidden buy-again dismissal', async () => {
		const purchasePatternRepository = new DrizzlePurchasePatternRepository(integrationDb.db);
		await purchasePatternRepository.dismissPattern(householdId, normalizedKey);

		const response = await postRestore({
			request: new Request('http://localhost/api/brain/feedback/restore', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			}),
			locals: apiLocals()
		} as Parameters<typeof postRestore>[0]);

		expect(response.status).toBe(200);
		const rows = await integrationDb.db
			.select()
			.from(receiptPatternDismissalTable)
			.where(eq(receiptPatternDismissalTable.householdId, householdId));
		expect(rows).toHaveLength(0);
	});
});
