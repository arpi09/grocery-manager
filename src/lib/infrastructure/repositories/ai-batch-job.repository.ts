import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { aiBatchJobTable } from '$lib/infrastructure/db/schema';
import type { AiBatchJobStatus, AiBatchKind } from '$lib/domain/ai-batch';

export interface AiBatchJob {
	id: string;
	kind: AiBatchKind;
	status: AiBatchJobStatus;
	openaiBatchId: string | null;
	inputFileId: string | null;
	outputFileId: string | null;
	requestCount: number;
	payload: Record<string, unknown>;
	result: Record<string, unknown> | null;
	error: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateAiBatchJobInput {
	id: string;
	kind: AiBatchKind;
	status: AiBatchJobStatus;
	openaiBatchId?: string | null;
	inputFileId?: string | null;
	requestCount: number;
	payload: Record<string, unknown>;
	error?: string | null;
}

export interface UpdateAiBatchJobInput {
	status?: AiBatchJobStatus;
	openaiBatchId?: string | null;
	outputFileId?: string | null;
	result?: Record<string, unknown> | null;
	error?: string | null;
}

export interface IAiBatchJobRepository {
	create(input: CreateAiBatchJobInput): Promise<AiBatchJob>;
	update(id: string, patch: UpdateAiBatchJobInput): Promise<void>;
	listActive(): Promise<AiBatchJob[]>;
	countActiveByKind(kind: AiBatchKind): Promise<number>;
	latestCreatedAt(kind: AiBatchKind): Promise<Date | null>;
	listRecentApplied(kind: AiBatchKind, since: Date): Promise<AiBatchJob[]>;
	deleteOlderThan(cutoff: Date): Promise<number>;
}

const ACTIVE_STATUSES: AiBatchJobStatus[] = ['submitted', 'completed'];

export class DrizzleAiBatchJobRepository implements IAiBatchJobRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async create(input: CreateAiBatchJobInput): Promise<AiBatchJob> {
		const now = new Date();
		const [row] = await this.db
			.insert(aiBatchJobTable)
			.values({
				id: input.id,
				kind: input.kind,
				status: input.status,
				openaiBatchId: input.openaiBatchId ?? null,
				inputFileId: input.inputFileId ?? null,
				requestCount: input.requestCount,
				payload: input.payload,
				error: input.error ?? null,
				createdAt: now,
				updatedAt: now
			})
			.returning();
		return mapRow(row);
	}

	async update(id: string, patch: UpdateAiBatchJobInput): Promise<void> {
		const set: Record<string, unknown> = { updatedAt: new Date() };
		if (patch.status !== undefined) set.status = patch.status;
		if (patch.openaiBatchId !== undefined) set.openaiBatchId = patch.openaiBatchId;
		if (patch.outputFileId !== undefined) set.outputFileId = patch.outputFileId;
		if (patch.result !== undefined) set.result = patch.result;
		if (patch.error !== undefined) set.error = patch.error;
		await this.db.update(aiBatchJobTable).set(set).where(eq(aiBatchJobTable.id, id));
	}

	async listActive(): Promise<AiBatchJob[]> {
		const rows = await this.db
			.select()
			.from(aiBatchJobTable)
			.where(inArray(aiBatchJobTable.status, ACTIVE_STATUSES))
			.orderBy(aiBatchJobTable.createdAt);
		return rows.map(mapRow);
	}

	async countActiveByKind(kind: AiBatchKind): Promise<number> {
		const [row] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(aiBatchJobTable)
			.where(and(eq(aiBatchJobTable.kind, kind), inArray(aiBatchJobTable.status, ACTIVE_STATUSES)));
		return row?.count ?? 0;
	}

	async latestCreatedAt(kind: AiBatchKind): Promise<Date | null> {
		const [row] = await this.db
			.select({ createdAt: aiBatchJobTable.createdAt })
			.from(aiBatchJobTable)
			.where(eq(aiBatchJobTable.kind, kind))
			.orderBy(desc(aiBatchJobTable.createdAt))
			.limit(1);
		return row?.createdAt ?? null;
	}

	async listRecentApplied(kind: AiBatchKind, since: Date): Promise<AiBatchJob[]> {
		const rows = await this.db
			.select()
			.from(aiBatchJobTable)
			.where(
				and(
					eq(aiBatchJobTable.kind, kind),
					eq(aiBatchJobTable.status, 'applied'),
					sql`${aiBatchJobTable.updatedAt} >= ${since}`
				)
			)
			.orderBy(desc(aiBatchJobTable.updatedAt));
		return rows.map(mapRow);
	}

	async deleteOlderThan(cutoff: Date): Promise<number> {
		const rows = await this.db
			.delete(aiBatchJobTable)
			.where(
				and(
					lt(aiBatchJobTable.createdAt, cutoff),
					inArray(aiBatchJobTable.status, ['applied', 'failed', 'expired'])
				)
			)
			.returning();
		return rows.length;
	}
}

function mapRow(row: typeof aiBatchJobTable.$inferSelect): AiBatchJob {
	return {
		id: row.id,
		kind: row.kind,
		status: row.status,
		openaiBatchId: row.openaiBatchId,
		inputFileId: row.inputFileId,
		outputFileId: row.outputFileId,
		requestCount: row.requestCount,
		payload: row.payload ?? {},
		result: row.result ?? null,
		error: row.error,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}
