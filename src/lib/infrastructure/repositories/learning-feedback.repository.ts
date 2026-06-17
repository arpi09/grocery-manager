import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { learningFeedbackTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';

export type LearningFeedbackType = 'accepted' | 'corrected' | 'rejected' | 'ignored';

export interface LearningFeedbackRecord {
	id: string;
	householdId: string;
	userId: string;
	predictorId: string;
	subjectKey: string;
	contextJson: Record<string, unknown>;
	predictedValue: string;
	actualValue: string | null;
	feedbackType: LearningFeedbackType;
	modelVersion: string;
	createdAt: Date;
}

export interface InsertLearningFeedbackInput {
	householdId: string;
	userId: string;
	predictorId: string;
	subjectKey: string;
	contextJson?: Record<string, unknown>;
	predictedValue: string;
	actualValue?: string | null;
	feedbackType: LearningFeedbackType;
	modelVersion: string;
}

export interface ListLearningFeedbackOptions {
	since?: Date;
	limit?: number;
}

export interface RecentFeedbackLookup {
	predictorId: string;
	subjectKey: string;
	feedbackType: LearningFeedbackType;
}

export interface ILearningFeedbackRepository {
	insert(input: InsertLearningFeedbackInput): Promise<LearningFeedbackRecord>;
	listByHouseholdAndPredictor(
		householdId: string,
		predictorId: string,
		options?: ListLearningFeedbackOptions
	): Promise<LearningFeedbackRecord[]>;
	hasRecentFeedback(
		householdId: string,
		lookup: RecentFeedbackLookup,
		withinMs: number
	): Promise<boolean>;
	latestBySubjectKeys(
		householdId: string,
		predictorId: string,
		subjectKeys: string[]
	): Promise<Map<string, LearningFeedbackRecord>>;
}

function mapFeedback(row: typeof learningFeedbackTable.$inferSelect): LearningFeedbackRecord {
	return {
		id: row.id,
		householdId: row.householdId,
		userId: row.userId,
		predictorId: row.predictorId,
		subjectKey: row.subjectKey,
		contextJson: row.contextJson ?? {},
		predictedValue: row.predictedValue,
		actualValue: row.actualValue,
		feedbackType: row.feedbackType as LearningFeedbackType,
		modelVersion: row.modelVersion,
		createdAt: row.createdAt
	};
}

export class DrizzleLearningFeedbackRepository implements ILearningFeedbackRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async insert(input: InsertLearningFeedbackInput): Promise<LearningFeedbackRecord> {
		const id = generateId();
		const [row] = await this.database
			.insert(learningFeedbackTable)
			.values({
				id,
				householdId: input.householdId,
				userId: input.userId,
				predictorId: input.predictorId,
				subjectKey: input.subjectKey,
				contextJson: input.contextJson ?? {},
				predictedValue: input.predictedValue,
				actualValue: input.actualValue ?? null,
				feedbackType: input.feedbackType,
				modelVersion: input.modelVersion
			})
			.returning();

		return mapFeedback(row);
	}

	async listByHouseholdAndPredictor(
		householdId: string,
		predictorId: string,
		options: ListLearningFeedbackOptions = {}
	): Promise<LearningFeedbackRecord[]> {
		const conditions = [
			eq(learningFeedbackTable.householdId, householdId),
			eq(learningFeedbackTable.predictorId, predictorId)
		];
		if (options.since) {
			conditions.push(gte(learningFeedbackTable.createdAt, options.since));
		}

		let query = this.database
			.select()
			.from(learningFeedbackTable)
			.where(and(...conditions))
			.orderBy(desc(learningFeedbackTable.createdAt));

		if (options.limit !== undefined) {
			query = query.limit(options.limit) as typeof query;
		}

		const rows = await query;
		return rows.map(mapFeedback);
	}

	async hasRecentFeedback(
		householdId: string,
		lookup: RecentFeedbackLookup,
		withinMs: number
	): Promise<boolean> {
		const since = new Date(Date.now() - withinMs);
		const [row] = await this.database
			.select({ id: learningFeedbackTable.id })
			.from(learningFeedbackTable)
			.where(
				and(
					eq(learningFeedbackTable.householdId, householdId),
					eq(learningFeedbackTable.predictorId, lookup.predictorId),
					eq(learningFeedbackTable.subjectKey, lookup.subjectKey),
					eq(learningFeedbackTable.feedbackType, lookup.feedbackType),
					gte(learningFeedbackTable.createdAt, since)
				)
			)
			.limit(1);
		return Boolean(row);
	}

	async latestBySubjectKeys(
		householdId: string,
		predictorId: string,
		subjectKeys: string[]
	): Promise<Map<string, LearningFeedbackRecord>> {
		if (subjectKeys.length === 0) return new Map();

		const rows = await this.database
			.select()
			.from(learningFeedbackTable)
			.where(
				and(
					eq(learningFeedbackTable.householdId, householdId),
					eq(learningFeedbackTable.predictorId, predictorId),
					inArray(learningFeedbackTable.subjectKey, subjectKeys)
				)
			)
			.orderBy(desc(learningFeedbackTable.createdAt));

		const latest = new Map<string, LearningFeedbackRecord>();
		for (const row of rows) {
			if (!latest.has(row.subjectKey)) {
				latest.set(row.subjectKey, mapFeedback(row));
			}
		}
		return latest;
	}
}
