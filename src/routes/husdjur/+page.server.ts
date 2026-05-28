import { fail, redirect } from '@sveltejs/kit';
import {
	createPetFoodSchema,
	deletePetFoodSchema
} from '$lib/validation/pet.schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const petsEnabled = await locals.petService.getPetsEnabled(locals.user!.id);
	if (!petsEnabled) {
		redirect(302, '/settings');
	}

	const pets = await locals.petService.listPets(locals.user!.id);
	const petFood = await locals.petFoodService.listPetFood(locals.user!.id);
	return {
		petsEnabled,
		pets,
		petFood
	};
};

export const actions: Actions = {
	addPetFood: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createPetFoodSchema.safeParse({
			petId: formData.get('petId'),
			name: formData.get('name'),
			quantity: formData.get('quantity'),
			unit: formData.get('unit'),
			notes: formData.get('notes')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petFoodService.addPetFood(locals.user!.id, {
			petId: parsed.data.petId || null,
			name: parsed.data.name,
			quantity: parsed.data.quantity,
			unit: parsed.data.unit || null,
			notes: parsed.data.notes || null
		});

		redirect(302, '/husdjur');
	},
	deletePetFood: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deletePetFoodSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petFoodService.deletePetFood(locals.user!.id, parsed.data.id);
		redirect(302, '/husdjur');
	}
};
