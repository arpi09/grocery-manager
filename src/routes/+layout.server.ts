import { isThemePreference } from '$lib/domain/theme';
import { resolveThemeForRequest } from '$lib/server/theme-cookie';
import { fail, redirect } from '@sveltejs/kit';
import {
	LastOwnerError,
	NotMemberError
} from '$lib/application/household.service';
import {
	createHouseholdSchema,
	leaveHouseholdSchema,
	switchHouseholdSchema
} from '$lib/validation/household.schemas';
import type { Actions, LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		return {
			user: null,
			themePreference: null,
			resolvedTheme: null,
			households: [],
			activeHousehold: null,
			householdRole: null
		};
	}

	const rawPreference = locals.user.themePreference;
	const storedPreference =
		rawPreference && isThemePreference(rawPreference) ? rawPreference : 'system';
	const { preference, resolved } = resolveThemeForRequest({ request }, storedPreference);

	const households = await locals.householdService.listHouseholdsForUser(locals.user.id);
	const activeId = locals.householdId;
	const activeHousehold =
		households.find((h) => h.id === activeId) ??
		(activeId && households.length > 0
			? { id: activeId, name: 'Pantry', role: locals.householdRole ?? 'viewer', isActive: true }
			: null);

	const householdsWithActive = households.map((h) => ({
		...h,
		isActive: h.id === activeId
	}));

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			displayName: locals.user.displayName,
			avatarUrl: locals.user.avatarUrl,
			role: locals.user.role,
			petsEnabled: Boolean(locals.user.petsEnabled)
		},
		themePreference: preference,
		resolvedTheme: resolved,
		households: householdsWithActive,
		activeHousehold: activeHousehold
			? { id: activeHousehold.id, name: activeHousehold.name }
			: null,
		householdRole: locals.householdRole
	};
};

function pantryActionError(error: unknown) {
	if (error instanceof NotMemberError) {
		return fail(403, { pantryError: error.message });
	}
	if (error instanceof LastOwnerError) {
		return fail(400, { pantryError: error.message });
	}
	throw error;
}

export const actions: Actions = {
	switchHousehold: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = switchHouseholdSchema.safeParse({
			householdId: formData.get('householdId')
		});

		if (!parsed.success) {
			return fail(400, { pantryError: 'Ogiltig pantry.' });
		}

		try {
			await locals.householdService.switchActiveHousehold(
				locals.user!.id,
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
	},

	createHousehold: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = createHouseholdSchema.safeParse({
			name: formData.get('name')
		});

		if (!parsed.success) {
			return fail(400, {
				pantryError: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Ogiltigt namn.'
			});
		}

		await locals.householdService.createHousehold(locals.user!.id, parsed.data.name);

		const redirectTo = formData.get('redirectTo');
		if (typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
			redirect(302, redirectTo);
		}

		redirect(302, '/');
	},

	leaveHousehold: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = leaveHouseholdSchema.safeParse({
			householdId: formData.get('householdId')
		});

		if (!parsed.success) {
			return fail(400, { pantryError: 'Ogiltig pantry.' });
		}

		try {
			await locals.householdService.leaveHousehold(locals.user!.id, parsed.data.householdId);
		} catch (error) {
			return pantryActionError(error);
		}

		redirect(302, '/settings');
	}
};
