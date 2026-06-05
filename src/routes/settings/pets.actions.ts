import { fail, redirect } from '@sveltejs/kit';
import { appendActionToast } from '$lib/utils/action-toast';
import {
	createPetSchema,
	deletePetSchema,
	updatePetsEnabledSchema
} from '$lib/validation/pet.schemas';
import type { RequestEvent } from '@sveltejs/kit';

export const petsActions = {
	togglePets: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = updatePetsEnabledSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.petService.setPetsEnabled(locals.user!.id, parsed.data.enabled === 'true');
		redirect(302, appendActionToast('/settings', 'settingsSaved'));
	},
	addPet: async ({ request, locals }: RequestEvent) => {
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
		redirect(302, appendActionToast('/settings', 'petAdded', parsed.data.name));
	},
	deletePet: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = deletePetSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		const pets = await locals.petService.listPets(locals.user!.id);
		const pet = pets.find((entry) => entry.id === parsed.data.id);

		await locals.petService.deletePet(locals.user!.id, parsed.data.id);
		redirect(302, appendActionToast('/settings', 'petRemoved', pet?.name));
	}
};
