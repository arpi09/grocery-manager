export interface PetFoodItem {
	id: string;
	userId: string;
	petId: string | null;
	name: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreatePetFoodInput {
	petId?: string | null;
	name: string;
	quantity: string;
	unit?: string | null;
	notes?: string | null;
}
