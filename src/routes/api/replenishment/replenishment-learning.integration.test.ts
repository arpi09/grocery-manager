import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '$lib/infrastructure/db';
import { learningFeedbackTable } from '$lib/infrastructure/db/schema';
import { InventoryService } from '$lib/application/inventory.service';
import { PmfService } from '$lib/application/pmf.service';
import { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import { ShoppingListService } from '$lib/application/shopping-list.service';
import { LearningEngineService } from '$lib/application/learning/learning-engine.service';
import { HouseholdLearningAdapter } from '$lib/infrastructure/adapters/household-learning.adapter';
import { LearningFeedbackAdapter } from '$lib/infrastructure/adapters/learning-feedback.adapter';
import { DrizzleConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import { DrizzleHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import { DrizzleInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import { DrizzleLearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { DrizzlePurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { translate } from '$lib/i18n/messages';
import { POST as acceptReplenishment } from './accept/+server';
import { POST as dismissReplenishment } from './dismiss/+server';

const { dbState, replenishmentLearningEnabled } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	replenishmentLearningEnabled: { value: true }
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

describe('Replenishment learning API integration', () => {
	let integrationDb: IntegrationDbContext;
	let purchasePatternService: PurchasePatternService;
	let learningEngineService: LearningEngineService;
	let pmfService: PmfService;
	const householdId = 'household-replenishment-learning';
	const userId = 'user-replenishment';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		const inventoryRepository = new DrizzleInventoryRepository(integrationDb.db);
		const consumptionRepository = new DrizzleConsumptionRepository(integrationDb.db);
		const householdRepository = new DrizzleHouseholdRepository(integrationDb.db);
		const inventoryService = new InventoryService(
			inventoryRepository,
			consumptionRepository,
			householdRepository
		);
		purchasePatternService = new PurchasePatternService(
			new DrizzlePurchasePatternRepository(integrationDb.db),
			inventoryService,
			new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db))
		);
		pmfService = new PmfService(new DrizzlePmfRepository());

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
	}, 30_000);

	beforeEach(async () => {
		replenishmentLearningEnabled.value = true;
		await integrationDb.reset();
		await integrationDb.seedUser({ id: userId, email: 'replenishment@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Replenishment learning household',
			members: [{ userId, role: 'owner' }]
		});
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	async function seedRecurringMilk() {
		await purchasePatternService.recordReceiptImport([
			{
				householdId,
				userId,
				importBatchId: 'import-1',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '1',
				unit: 'L'
			}
		]);
		await purchasePatternService.recordReceiptImport([
			{
				householdId,
				userId,
				importBatchId: 'import-2',
				productName: 'Arla Mjölk 1L',
				location: 'fridge',
				quantity: '2',
				unit: 'L'
			}
		]);
	}

	function apiLocals() {
		return {
			locale: 'sv' as const,
			user: { id: userId },
			householdId,
			householdRole: 'owner' as const,
			purchasePatternService,
			learningEngineService,
			pmfService
		};
	}

	it('records accepted replenishment feedback on accept', async () => {
		await seedRecurringMilk();
		const [suggestion] = await purchasePatternService.getReplenishmentSuggestions(householdId);

		const response = await acceptReplenishment({
			request: new Request('http://localhost/api/replenishment/accept', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ normalizedKey: suggestion.normalizedKey })
			}),
			locals: apiLocals()
		} as Parameters<typeof acceptReplenishment>[0]);

		expect(response.status).toBe(200);

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			predictorId: 'replenishment',
			subjectKey: suggestion.normalizedKey,
			feedbackType: 'accepted',
			predictedValue: suggestion.normalizedKey,
			actualValue: suggestion.displayName
		});
	});

	it('records ignored replenishment feedback on dismiss', async () => {
		await seedRecurringMilk();
		const [suggestion] = await purchasePatternService.getReplenishmentSuggestions(householdId);

		const response = await dismissReplenishment({
			request: new Request('http://localhost/api/replenishment/dismiss', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ normalizedKey: suggestion.normalizedKey })
			}),
			locals: apiLocals()
		} as Parameters<typeof dismissReplenishment>[0]);

		expect(response.status).toBe(200);

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			predictorId: 'replenishment',
			subjectKey: suggestion.normalizedKey,
			feedbackType: 'ignored',
			predictedValue: suggestion.normalizedKey
		});
	});

	it('skips learning feedback when replenishment learning flag is off', async () => {
		replenishmentLearningEnabled.value = false;
		await seedRecurringMilk();
		const [suggestion] = await purchasePatternService.getReplenishmentSuggestions(householdId);

		const response = await dismissReplenishment({
			request: new Request('http://localhost/api/replenishment/dismiss', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ normalizedKey: suggestion.normalizedKey })
			}),
			locals: apiLocals()
		} as Parameters<typeof dismissReplenishment>[0]);

		expect(response.status).toBe(200);

		const rows = await integrationDb.db
			.select()
			.from(learningFeedbackTable)
			.where(eq(learningFeedbackTable.householdId, householdId));
		expect(rows).toHaveLength(0);
	});

	it('returns 400 for invalid accept payload', async () => {
		const response = await acceptReplenishment({
			request: new Request('http://localhost/api/replenishment/accept', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({})
			}),
			locals: apiLocals()
		} as Parameters<typeof acceptReplenishment>[0]);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(translate('sv', 'replenishment.invalidKey'));
	});
});
