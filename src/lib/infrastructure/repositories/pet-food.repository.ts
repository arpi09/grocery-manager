import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { petFoodTable } from '$lib/infrastructure/db/schema';
import type { CreatePetFoodInput, PetFoodItem } from '$lib/domain/pet-food';

export interface IPetFoodRepository {
	listByUser(userId: string): Promise<PetFoodItem[]>;
	create(userId: string, id: string, input: CreatePetFoodInput): Promise<PetFoodItem>;
	delete(userId: string, id: string): Promise<boolean>;
}

function mapPetFood(row: typeof petFoodTable.$inferSelect): PetFoodItem {
	return {
		id: row.id,
		userId: row.userId,
		petId: row.petId,
		name: row.name,
		quantity: row.quantity,
		unit: row.unit,
		notes: row.notes,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export class DrizzlePetFoodRepository implements IPetFoodRepository {
	async listByUser(userId: string) {
		const rows = await db
			.select()
			.from(petFoodTable)
			.where(eq(petFoodTable.userId, userId))
			.orderBy(desc(petFoodTable.updatedAt));
		return rows.map(mapPetFood);
	}

	async create(userId: string, id: string, input: CreatePetFoodInput) {
		const now = new Date();
		const [row] = await db
			.insert(petFoodTable)
			.values({
				id,
				userId,
				petId: input.petId ?? null,
				name: input.name,
				quantity: input.quantity,
				unit: input.unit ?? null,
				notes: input.notes ?? null,
				createdAt: now,
				updatedAt: now
			})
			.returning();
		return mapPetFood(row);
	}

	async delete(userId: string, id: string) {
		const rows = await db
			.delete(petFoodTable)
			.where(and(eq(petFoodTable.userId, userId), eq(petFoodTable.id, id)))
			.returning();
		return rows.length > 0;
	}
}
