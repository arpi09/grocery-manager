import type { AdminAiUsageRepositorySummary } from '$lib/domain/ai-usage-admin';
import {
	ADMIN_AI_USAGE_PERIOD_DAYS,
	ADMIN_AI_USAGE_TOP_HOUSEHOLDS,
	emptyAdminUsageByKind
} from '$lib/domain/ai-usage-admin';
import type { AiUsageKind } from '$lib/domain/ai-usage';
import { generateId } from '$lib/infrastructure/auth/id';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { aiUsageTable } from '$lib/infrastructure/db/schema';
import { and, eq, gte, notLike, sql } from 'drizzle-orm';

export interface ConsumeAiUsageInput {
	scopeId: string;
	userId: string;
	kind: AiUsageKind;
	periodKey: string;
}

export interface AdminAiUsageSummaryInput {
	since: Date;
	monthStart: Date;
	monthKey: string;
	topLimit?: number;
	periodDays?: number;
}

export interface IAiUsageRepository {
	getCount(input: Pick<ConsumeAiUsageInput, 'scopeId' | 'kind' | 'periodKey'>): Promise<number>;
	increment(input: ConsumeAiUsageInput): Promise<number>;
	getAdminSummary(input: AdminAiUsageSummaryInput): Promise<AdminAiUsageRepositorySummary>;
}

export class DrizzleAiUsageRepository implements IAiUsageRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async getCount(input: Pick<ConsumeAiUsageInput, 'scopeId' | 'kind' | 'periodKey'>): Promise<number> {
		const rows = await this.database
			.select({ count: aiUsageTable.count })
			.from(aiUsageTable)
			.where(
				and(
					eq(aiUsageTable.scopeId, input.scopeId),
					eq(aiUsageTable.kind, input.kind),
					eq(aiUsageTable.periodKey, input.periodKey)
				)
			)
			.limit(1);

		return rows[0]?.count ?? 0;
	}

	async increment(input: ConsumeAiUsageInput): Promise<number> {
		const rows = await this.database
			.insert(aiUsageTable)
			.values({
				id: generateId(),
				scopeId: input.scopeId,
				userId: input.userId,
				kind: input.kind,
				periodKey: input.periodKey,
				count: 1
			})
			.onConflictDoUpdate({
				target: [aiUsageTable.scopeId, aiUsageTable.kind, aiUsageTable.periodKey],
				set: {
					count: sql`${aiUsageTable.count} + 1`,
					userId: input.userId,
					updatedAt: new Date()
				}
			})
			.returning();

		return rows[0]?.count ?? 1;
	}

	async getAdminSummary(input: AdminAiUsageSummaryInput): Promise<AdminAiUsageRepositorySummary> {
		const topLimit = input.topLimit ?? ADMIN_AI_USAGE_TOP_HOUSEHOLDS;

		const [kindRows, topRows, monthlyRows, monthlyKindRows] = await Promise.all([
			this.database
				.select({
					kind: aiUsageTable.kind,
					total: sql<number>`coalesce(sum(${aiUsageTable.count}), 0)`.mapWith(Number)
				})
				.from(aiUsageTable)
				.where(gte(aiUsageTable.updatedAt, input.since))
				.groupBy(aiUsageTable.kind),
			this.database
				.select({
					total: sql<number>`coalesce(sum(${aiUsageTable.count}), 0)`.mapWith(Number)
				})
				.from(aiUsageTable)
				.where(
					and(
						gte(aiUsageTable.updatedAt, input.since),
						notLike(aiUsageTable.scopeId, 'user:%')
					)
				)
				.groupBy(aiUsageTable.scopeId)
				.orderBy(sql`sum(${aiUsageTable.count}) desc`)
				.limit(topLimit),
			this.database
				.select({
					total: sql<number>`coalesce(sum(${aiUsageTable.count}), 0)`.mapWith(Number)
				})
				.from(aiUsageTable)
				.where(gte(aiUsageTable.updatedAt, input.monthStart)),
			this.database
				.select({
					kind: aiUsageTable.kind,
					total: sql<number>`coalesce(sum(${aiUsageTable.count}), 0)`.mapWith(Number)
				})
				.from(aiUsageTable)
				.where(gte(aiUsageTable.updatedAt, input.monthStart))
				.groupBy(aiUsageTable.kind)
		]);

		const byKind = emptyAdminUsageByKind();
		for (const row of kindRows) {
			byKind[row.kind] = row.total;
		}

		const monthlyByKind = emptyAdminUsageByKind();
		for (const row of monthlyKindRows) {
			monthlyByKind[row.kind] = row.total;
		}

		return {
			periodDays: input.periodDays ?? ADMIN_AI_USAGE_PERIOD_DAYS,
			byKind,
			monthlyByKind,
			topHouseholdCounts: topRows.map((row) => row.total),
			monthlyTotal: monthlyRows[0]?.total ?? 0,
			monthKey: input.monthKey
		};
	}
}
