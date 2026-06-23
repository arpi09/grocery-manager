import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { learningFeedbackTable } from '$lib/infrastructure/db/schema';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import {
	buildReceiptHouseholdMemorySection,
	type LoadReceiptHouseholdMemoryOptions
} from '$lib/server/receipt-household-memory';
import type { IPurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';

const PRIOR_CORRECTIONS_LIMIT = 5;
const GLOBAL_FEW_SHOT_LIMIT = 8;
const GLOBAL_FEW_SHOT_CACHE_MS = 24 * 60 * 60 * 1000;
const GLOBAL_FEW_SHOT_LOOKBACK_DAYS = 90;

export interface PriorCorrectionRow {
	subjectKey: string;
	productName: string;
	predictedExpiresOn: string;
	actualExpiresOn: string;
}

export interface GlobalCorrectedProduct {
	subjectKey: string;
	productName: string;
	correctionCount: number;
}

let globalFewShotCache: { loadedAt: number; block: string } | null = null;

function readProductName(contextJson: Record<string, unknown>, subjectKey: string): string {
	const name = contextJson.productName;
	return typeof name === 'string' && name.trim() ? name.trim() : subjectKey;
}

export async function loadPriorCorrections(
	repository: ILearningFeedbackRepository,
	householdId: string
): Promise<PriorCorrectionRow[]> {
	const rows = await repository.listByHouseholdAndPredictor(householdId, 'shelf_life', {
		limit: PRIOR_CORRECTIONS_LIMIT * 3
	});

	const corrections: PriorCorrectionRow[] = [];
	for (const row of rows) {
		if (row.feedbackType !== 'corrected') continue;
		if (!row.predictedValue || !row.actualValue) continue;
		corrections.push({
			subjectKey: row.subjectKey,
			productName: readProductName(row.contextJson, row.subjectKey),
			predictedExpiresOn: row.predictedValue,
			actualExpiresOn: row.actualValue
		});
		if (corrections.length >= PRIOR_CORRECTIONS_LIMIT) break;
	}
	return corrections;
}

export function buildPriorCorrectionsBlock(rows: PriorCorrectionRow[]): string {
	if (rows.length === 0) return '';
	const lines = rows.map(
		(row) =>
			`- ${row.productName} (${row.subjectKey}): modellen gissade ${row.predictedExpiresOn}, användaren rättade till ${row.actualExpiresOn}`
	);
	return ['Tidigare korrigeringar i detta hushåll (respektera vid BBF-gissning):', ...lines].join('\n');
}

async function queryTopCorrectedProducts(): Promise<GlobalCorrectedProduct[]> {
	const since = new Date(Date.now() - GLOBAL_FEW_SHOT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
	const rows = await db
		.select({
			subjectKey: learningFeedbackTable.subjectKey,
			productName: sql<string | null>`max(${learningFeedbackTable.contextJson}->>'productName')`,
			correctionCount: sql<number>`count(*)::int`
		})
		.from(learningFeedbackTable)
		.where(
			and(
				eq(learningFeedbackTable.predictorId, 'shelf_life'),
				eq(learningFeedbackTable.feedbackType, 'corrected'),
				gte(learningFeedbackTable.createdAt, since)
			)
		)
		.groupBy(learningFeedbackTable.subjectKey)
		.orderBy(desc(sql`count(*)`))
		.limit(GLOBAL_FEW_SHOT_LIMIT);

	return rows.map((row) => ({
		subjectKey: row.subjectKey,
		productName: row.productName?.trim() || row.subjectKey,
		correctionCount: row.correctionCount ?? 0
	}));
}

export function buildGlobalCorrectedFewShotBlock(products: GlobalCorrectedProduct[]): string {
	if (products.length === 0) return '';
	const lines = products.map(
		(product) => `- ${product.productName}: ofta korrigerad (${product.correctionCount} ggr)`
	);
	return [
		'Globala få-exempel (produkter som ofta korrigeras — var extra försiktig med BBF):',
		...lines
	].join('\n');
}

export async function loadGlobalCorrectedFewShotBlock(): Promise<string> {
	const now = Date.now();
	if (globalFewShotCache && now - globalFewShotCache.loadedAt < GLOBAL_FEW_SHOT_CACHE_MS) {
		return globalFewShotCache.block;
	}

	const products = await queryTopCorrectedProducts();
	const block = buildGlobalCorrectedFewShotBlock(products);
	globalFewShotCache = { loadedAt: now, block };
	return block;
}

export interface ShelfLifePromptFeedbackBlocks {
	priorCorrectionsBlock: string;
	globalFewShotBlock: string;
}

export async function loadShelfLifePromptFeedbackBlocks(
	repository: ILearningFeedbackRepository,
	householdId: string
): Promise<ShelfLifePromptFeedbackBlocks> {
	const [priorCorrections, globalFewShotBlock] = await Promise.all([
		loadPriorCorrections(repository, householdId),
		loadGlobalCorrectedFewShotBlock()
	]);
	return {
		priorCorrectionsBlock: buildPriorCorrectionsBlock(priorCorrections),
		globalFewShotBlock
	};
}

export interface ReceiptParseFeedbackContext extends ShelfLifePromptFeedbackBlocks {
	householdMemoryBlockOverride: string;
}

export async function loadReceiptParseFeedbackContext(
	repository: ILearningFeedbackRepository,
	householdId: string,
	purchasePatternRepository: IPurchasePatternRepository,
	memoryOptions: LoadReceiptHouseholdMemoryOptions = {}
): Promise<ReceiptParseFeedbackContext> {
	const [feedbackBlocks, householdMemoryBlockOverride] = await Promise.all([
		loadShelfLifePromptFeedbackBlocks(repository, householdId),
		buildReceiptHouseholdMemorySection(purchasePatternRepository, householdId, memoryOptions)
	]);
	return {
		...feedbackBlocks,
		householdMemoryBlockOverride
	};
}
