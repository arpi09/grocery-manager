import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { petTable, userTable } from '$lib/infrastructure/db/schema';
import type { Pet } from '$lib/domain/pet';

export interface IPetRepository {
	listByUser(userId: string): Promise<Pet[]>;
	create(userId: string, id: string, name: string, species: string | null): Promise<Pet>;
	delete(userId: string, id: string): Promise<boolean>;
	setPetsEnabled(userId: string, enabled: boolean): Promise<void>;
	getPetsEnabled(userId: string): Promise<boolean>;
}

function mapPet(row: typeof petTable.$inferSelect): Pet {
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		species: row.species,
		createdAt: row.createdAt
	};
}

export class DrizzlePetRepository implements IPetRepository {
	async listByUser(userId: string) {
		const rows = await db
			.select()
			.from(petTable)
			.where(eq(petTable.userId, userId))
			.orderBy(desc(petTable.createdAt));
		return rows.map(mapPet);
	}

	async create(userId: string, id: string, name: string, species: string | null) {
		const [row] = await db
			.insert(petTable)
			.values({
				id,
				userId,
				name,
				species
			})
			.returning();
		return mapPet(row);
	}

	async delete(userId: string, id: string) {
		const rows = await db
			.delete(petTable)
			.where(and(eq(petTable.id, id), eq(petTable.userId, userId)))
			.returning();
		return rows.length > 0;
	}

	async setPetsEnabled(userId: string, enabled: boolean) {
		await db.update(userTable).set({ petsEnabled: enabled }).where(eq(userTable.id, userId));
	}

	async getPetsEnabled(userId: string) {
		const [row] = await db
			.select({ petsEnabled: userTable.petsEnabled })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		return row?.petsEnabled ?? false;
	}
}
