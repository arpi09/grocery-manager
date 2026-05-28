import { AdminError } from '$lib/application/admin.service';
import { lucia } from '$lib/infrastructure/auth/lucia';
import {
	adminLogoutAllSchema,
	adminSetPetsSchema,
	adminSetRoleSchema,
	adminUserIdSchema
} from '$lib/validation/admin.schemas';
import {
	ERROR_LOG_ADMIN_LIST_DEFAULT,
	ERROR_LOG_ADMIN_LIST_MAX
} from '$lib/domain/error-log';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function parseErrorLogLimit(raw: string | null): number {
	const parsed = Number(raw ?? ERROR_LOG_ADMIN_LIST_DEFAULT);
	if (!Number.isFinite(parsed)) {
		return ERROR_LOG_ADMIN_LIST_DEFAULT;
	}
	return Math.min(
		ERROR_LOG_ADMIN_LIST_MAX,
		Math.max(1, Math.floor(parsed))
	);
}

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { user } = await parent();
	const errorLimit = parseErrorLogLimit(url.searchParams.get('errorLimit'));
	const [stats, users, errors] = await Promise.all([
		locals.adminService.getDashboardStats(),
		locals.adminService.listUsers(),
		locals.adminService.listRecentErrors(errorLimit)
	]);

	return {
		user,
		stats,
		users,
		errors,
		errorLimit
	};
};

export const actions: Actions = {
	setRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSetRoleSchema.safeParse({
			userId: formData.get('userId'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid role update.' });
		}

		try {
			await locals.adminService.setUserRole(
				locals.user!.id,
				parsed.data.userId,
				parsed.data.role
			);
		} catch (error) {
			if (error instanceof AdminError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, '/admin');
	},
	setPets: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSetPetsSchema.safeParse({
			userId: formData.get('userId'),
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid pets update.' });
		}

		await locals.adminService.setUserPetsEnabled(
			parsed.data.userId,
			parsed.data.enabled === 'true'
		);
		redirect(302, '/admin');
	},
	logoutAll: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsed = adminLogoutAllSchema.safeParse({
			confirm: formData.get('confirm')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Skriv bekräftelse för att logga ut alla.' });
		}

		const sessionCount = await locals.adminService.logoutAllUsers();
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		redirect(
			302,
			`/login?message=${encodeURIComponent(`Alla användare har loggats ut (${sessionCount} sessioner).`)}`
		);
	},
	logoutUser: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsed = adminUserIdSchema.safeParse({
			userId: formData.get('userId')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Ogiltig användare.' });
		}

		await locals.adminService.logoutUser(parsed.data.userId);

		if (parsed.data.userId === locals.user!.id) {
			const sessionCookie = lucia.createBlankSessionCookie();
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});
			redirect(302, '/login?message=' + encodeURIComponent('Du har loggats ut.'));
		}

		redirect(302, '/admin');
	}
};
