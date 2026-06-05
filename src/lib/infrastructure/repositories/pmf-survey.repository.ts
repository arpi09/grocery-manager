import { count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { pmfSurveyResponseTable, userTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';
import {
	computeNpsSummary,
	type PmfSurveyResponseEntry,
	type PmfSurveySummary,
	type PmfWouldMiss,
	type SubmitPmfSurveyInput
} from '$lib/domain/pmf-survey';

export interface IPmfSurveyRepository {
	submit(input: SubmitPmfSurveyInput): Promise<string>;
	listRecent(limit: number): Promise<PmfSurveyResponseEntry[]>;
	getSummary(): Promise<PmfSurveySummary>;
}

export class DrizzlePmfSurveyRepository implements IPmfSurveyRepository {
	async submit(input: SubmitPmfSurveyInput): Promise<string> {
		const id = generateId();
		await db.insert(pmfSurveyResponseTable).values({
			id,
			userId: input.userId,
			householdId: input.householdId,
			trigger: input.trigger,
			npsScore: input.npsScore,
			wouldMiss: input.wouldMiss,
			comment: input.comment
		});
		return id;
	}

	async listRecent(limit: number): Promise<PmfSurveyResponseEntry[]> {
		const rows = await db
			.select({
				id: pmfSurveyResponseTable.id,
				userId: pmfSurveyResponseTable.userId,
				userEmail: userTable.email,
				householdId: pmfSurveyResponseTable.householdId,
				trigger: pmfSurveyResponseTable.trigger,
				npsScore: pmfSurveyResponseTable.npsScore,
				wouldMiss: pmfSurveyResponseTable.wouldMiss,
				comment: pmfSurveyResponseTable.comment,
				createdAt: pmfSurveyResponseTable.createdAt
			})
			.from(pmfSurveyResponseTable)
			.innerJoin(userTable, eq(pmfSurveyResponseTable.userId, userTable.id))
			.orderBy(desc(pmfSurveyResponseTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			userId: row.userId,
			userEmail: row.userEmail,
			householdId: row.householdId,
			trigger: row.trigger as PmfSurveyResponseEntry['trigger'],
			npsScore: row.npsScore,
			wouldMiss: row.wouldMiss as PmfWouldMiss,
			comment: row.comment,
			createdAt: row.createdAt
		}));
	}

	async getSummary(): Promise<PmfSurveySummary> {
		const [totalRow, rows] = await Promise.all([
			db.select({ total: count() }).from(pmfSurveyResponseTable),
			db
				.select({
					npsScore: pmfSurveyResponseTable.npsScore,
					wouldMiss: pmfSurveyResponseTable.wouldMiss
				})
				.from(pmfSurveyResponseTable)
		]);

		const wouldMiss: Record<PmfWouldMiss, number> = {
			yes: 0,
			somewhat: 0,
			no: 0
		};

		for (const row of rows) {
			const key = row.wouldMiss as PmfWouldMiss;
			wouldMiss[key] += 1;
		}

		const npsStats = computeNpsSummary(rows.map((row) => row.npsScore));

		return {
			totalResponses: totalRow[0]?.total ?? 0,
			...npsStats,
			wouldMiss
		};
	}
}
