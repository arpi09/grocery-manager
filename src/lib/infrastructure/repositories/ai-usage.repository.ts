import type { AiUsageKind } from '$lib/domain/ai-usage';
import { generateId } from '$lib/infrastructure/auth/id';
import { db } from '$lib/infrastructure/db';
import { aiUsageTable } from '$lib/infrastructure/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export interface ConsumeAiUsageInput {
	scopeId: string;
	userId: string;
	kind: AiUsageKind;
	periodKey: string;
}

export interface IAiUsageRepository {
	getCount(input: Pick<ConsumeAiUsageInput, 'scopeId' | 'kind' | 'periodKey'>): Promise<number>;
	increment(input: ConsumeAiUsageInput): Promise<number>;
}

export class DrizzleAiUsageRepository implements IAiUsageRepository {
	async getCount(input: Pick<ConsumeAiUsageInput, 'scopeId' | 'kind' | 'periodKey'>): Promise<number> {
		const rows = await db
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
		const rows = await db
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
}
