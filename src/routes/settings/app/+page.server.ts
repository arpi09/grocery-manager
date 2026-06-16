import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	const pets = user ? await locals.petService.listPets(user.id) : [];

	return {
		petsEnabled: Boolean(user?.petsEnabled),
		pets
	};
};
