import { fail, redirect } from '@sveltejs/kit';
import {
	createPetSchema,
	deletePetSchema,
	updatePetsEnabledSchema
} from '$lib/validation/pet.schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();
	const pets = user ? await locals.petService.listPets(user.id) : [];
	const household = user
		? await locals.householdService.getHouseholdForUser(user.id)
		: null;
	return {
		user,
		petsEnabled: Boolean(user?.petsEnabled),
		pets,
		household
	};
};

export const actions: Actions = {
	togglePets: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = updatePetsEnabledSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.setPetsEnabled(locals.user!.id, parsed.data.enabled === 'true');
		redirect(302, '/settings');
	},
	addPet: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createPetSchema.safeParse({
			name: formData.get('name'),
			species: formData.get('species')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.addPet(
			locals.user!.id,
			parsed.data.name,
			parsed.data.species || null
		);
		redirect(302, '/settings');
	},
	deletePet: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = deletePetSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.deletePet(locals.user!.id, parsed.data.id);
		redirect(302, '/settings');
	}
};
