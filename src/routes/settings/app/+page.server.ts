import { petsActions } from '../pets.actions';
import { autoFinishActions } from '../auto-finish.actions';
import { userRepository } from '$lib/server/di';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	const pets = user ? await locals.petService.listPets(user.id) : [];
	const autoFinishExpiredEnabled = user
		? await userRepository.getAutoFinishExpiredEnabled(user.id)
		: false;

	return {
		petsEnabled: Boolean(user?.petsEnabled),
		pets,
		autoFinishExpiredEnabled
	};
};

export const actions: Actions = {
	...petsActions,
	...autoFinishActions
};
