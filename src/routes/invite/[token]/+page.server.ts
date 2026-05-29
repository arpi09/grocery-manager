import { fail, redirect } from '@sveltejs/kit';
import {
	AlreadyMemberError,
	InviteEmailMismatchError,
	InviteExpiredError,
	InviteNotFoundError,
	InviteNotPendingError
} from '$lib/application/household.service';
import { inviteRoleLabel } from '$lib/domain/household';
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

function acceptError(error: unknown) {
	if (error instanceof InviteNotFoundError) {
		return fail(404, { acceptError: error.message });
	}
	if (error instanceof InviteNotPendingError || error instanceof InviteExpiredError) {
		return fail(400, { acceptError: error.message });
	}
	if (error instanceof InviteEmailMismatchError || error instanceof AlreadyMemberError) {
		return fail(400, { acceptError: error.message });
	}
	throw error;
}

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
			return acceptError(error);
		}

		redirect(302, '/');
	}
};
