import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { redirect } from '@sveltejs/kit';
import { InviteNotFoundError } from '$lib/application/household.service';
import { mapHouseholdErrorToFail } from '$lib/application/household-errors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	let preview;
	try {
		preview = await locals.householdService.getInvitePreview(params.token);
	} catch (error) {
		if (error instanceof InviteNotFoundError) {
			return {
				preview: null,
				token: params.token,
				redirectTo: url.pathname,
				user: locals.user
			};
		}
		throw error;
	}

	const user = locals.user;
	const emailMatches =
		user && user.email.trim().toLowerCase() === preview.email.trim().toLowerCase();
	const canAccept =
		!!user &&
		emailMatches &&
		preview.status === 'pending' &&
		!preview.expired;

	return {
		preview,
		token: params.token,
		redirectTo: url.pathname,
		user,
		emailMatches,
		canAccept
	};
};

export const actions: Actions = {
	accept: async ({ params, locals }) => {
		if (!locals.user) {
			redirect(302, `/login?redirect=${encodeURIComponent(`/invite/${params.token}`)}`);
		}

		try {
			await locals.householdService.acceptInvite(
				params.token,
				locals.user.id,
				locals.user.email
			);
		} catch (error) {
			return mapHouseholdErrorToFail(error, 'acceptError', locals.locale);
		}

		redirect(302, APP_HOME_PATH);
	}
};
