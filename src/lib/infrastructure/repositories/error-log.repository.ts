import { desc, eq, inArray, lt } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { appErrorTable } from '$lib/infrastructure/db/schema';
import type { AppErrorEntry, AppErrorSummary, RecordAppErrorInput } from '$lib/domain/error-log';
import {
	ERROR_LOG_MAX_ENTRIES,
	ERROR_LOG_RETENTION_MS
} from '$lib/domain/error-log';

export interface IErrorLogRepository {
	insert(entry: RecordAppErrorInput & { id: string }): Promise<void>;
	listRecent(limit: number): Promise<AppErrorEntry[]>;
	listRecentSummaries(limit: number): Promise<AppErrorSummary[]>;
	getStack(id: string): Promise<string | null>;
	enforceRetention(): Promise<void>;
}

export class DrizzleErrorLogRepository implements IErrorLogRepository {
	async insert(entry: RecordAppErrorInput & { id: string }) {
		await db.insert(appErrorTable).values({
			id: entry.id,
			message: entry.message,
			stack: entry.stack ?? null,
			path: entry.path,
			userId: entry.userId ?? null,
			statusCode: entry.statusCode ?? null
		});
	}

	async listRecent(limit: number): Promise<AppErrorEntry[]> {
		const rows = await db
			.select()
			.from(appErrorTable)
			.orderBy(desc(appErrorTable.createdAt))
			.limit(limit);

		return rows.map((row) => ({
			id: row.id,
			message: row.message,
			stack: row.stack,
			path: row.path,
			userId: row.userId,
			statusCode: row.statusCode,
			createdAt: row.createdAt
		}));
	}

	async listRecentSummaries(limit: number): Promise<AppErrorSummary[]> {
		const rows = await db
			.select({
				id: appErrorTable.id,
				message: appErrorTable.message,
				stack: appErrorTable.stack,
				path: appErrorTable.path,
				userId: appErrorTable.userId,
				statusCode: appErrorTable.statusCode,
				createdAt: appErrorTable.createdAt
			})
			.from(appErrorTable)
			.orderBy(desc(appErrorTable.createdAt))
			.limit(limit);

		return rows.map(({ stack, ...row }) => ({
			...row,
			hasStack: stack !== null
		}));
	}

	async getStack(id: string): Promise<string | null> {
		const [row] = await db
			.select({ stack: appErrorTable.stack })
			.from(appErrorTable)
			.where(eq(appErrorTable.id, id))
			.limit(1);
		return row?.stack ?? null;
	}

	async enforceRetention() {
		const cutoff = new Date(Date.now() - ERROR_LOG_RETENTION_MS);
		await db.delete(appErrorTable).where(lt(appErrorTable.createdAt, cutoff));

		const ids = await db
			.select({ id: appErrorTable.id })
			.from(appErrorTable)
			.orderBy(desc(appErrorTable.createdAt));

		if (ids.length <= ERROR_LOG_MAX_ENTRIES) {
			return;
		}

		const excess = ids.slice(ERROR_LOG_MAX_ENTRIES).map((row) => row.id);
		if (excess.length > 0) {
			await db.delete(appErrorTable).where(inArray(appErrorTable.id, excess));
		}
	}
}
