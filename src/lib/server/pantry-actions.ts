import {
	LastOwnerError,
	NotMemberError
} from '$lib/application/household.service';
import {
	createHouseholdSchema,
	leaveHouseholdSchema,
	switchHouseholdSchema
} from '$lib/validation/household.schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

function pantryActionError(error: unknown) {
	if (error instanceof NotMemberError) {
		return fail(403, { pantryError: error.message });
	}
	if (error instanceof LastOwnerError) {
		return fail(400, { pantryError: error.message });
	}
	throw error;
}

export async function switchHouseholdAction(event: RequestEvent) {
	const formData = await event.request.formData();
	const parsed = switchHouseholdSchema.safeParse({
		householdId: formData.get('householdId')
	});

	if (!parsed.success) {
		return fail(400, { pantryError: 'Ogiltig pantry.' });
	}

	try {
		await event.locals.householdService.switchActiveHousehold(
			event.locals.user!.id,
			parsed.data.householdId
		);
	} catch (error) {
		return pantryActionError(error);
	}

	const redirectTo = formData.get('redirectTo');
	if (typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
		redirect(302, redirectTo);
	}

	redirect(302, '/');
}

export async function createHouseholdAction(event: RequestEvent) {
	const formData = await event.request.formData();
	const parsed = createHouseholdSchema.safeParse({
		name: formData.get('name')
	});

	if (!parsed.success) {
		return fail(400, {
			pantryError: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Ogiltigt namn.'
		});
	}

	await event.locals.householdService.createHousehold(event.locals.user!.id, parsed.data.name);

	const redirectTo = formData.get('redirectTo');
	if (typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
		redirect(302, redirectTo);
	}

	redirect(302, '/');
}

export async function leaveHouseholdAction(event: RequestEvent) {
	const formData = await event.request.formData();
	const parsed = leaveHouseholdSchema.safeParse({
		householdId: formData.get('householdId')
	});

	if (!parsed.success) {
		return fail(400, { pantryError: 'Ogiltig pantry.' });
	}

	try {
		await event.locals.householdService.leaveHousehold(
			event.locals.user!.id,
			parsed.data.householdId
		);
	} catch (error) {
		return pantryActionError(error);
	}

	redirect(302, '/settings');
}
