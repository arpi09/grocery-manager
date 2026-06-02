import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { adminActionLogTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';

export interface IAdminActionRepository {
	logAction(input: {
		actorUserId: string;
		action: string;
		targetUserId?: string | null;
		metadata?: Record<string, unknown> | null;
	}): Promise<void>;
}

export class DrizzleAdminActionRepository implements IAdminActionRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async logAction(input: {
		actorUserId: string;
		action: string;
		targetUserId?: string | null;
		metadata?: Record<string, unknown> | null;
	}) {
		await this.db.insert(adminActionLogTable).values({
			id: generateId(),
			actorUserId: input.actorUserId,
			action: input.action,
			targetUserId: input.targetUserId ?? null,
			metadata: input.metadata ? JSON.stringify(input.metadata) : null
		});
	}
}
