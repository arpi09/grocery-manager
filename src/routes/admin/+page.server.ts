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
import {
	PRODUCT_FEEDBACK_LIST_DEFAULT,
	PRODUCT_FEEDBACK_LIST_MAX
} from '$lib/domain/product-feedback';
import { fail, redirect } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import type { Actions, PageServerLoad } from './$types';

function parseFeedbackLimit(raw: string | null): number {
	const parsed = Number(raw ?? PRODUCT_FEEDBACK_LIST_DEFAULT);
	if (!Number.isFinite(parsed)) {
		return PRODUCT_FEEDBACK_LIST_DEFAULT;
	}
	return Math.min(PRODUCT_FEEDBACK_LIST_MAX, Math.max(1, Math.floor(parsed)));
}

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
	const feedbackLimit = parseFeedbackLimit(url.searchParams.get('feedbackLimit'));
	const [stats, users, errors, pmfMetrics, productFeedback] = await Promise.all([
		locals.adminService.getDashboardStats(),
		locals.adminService.listUsers(),
		locals.adminService.listRecentErrors(errorLimit),
		locals.pmfService.getGlobalMetrics(),
		locals.productFeedbackService.listRecent(feedbackLimit)
	]);

	return {
		user,
		stats,
		users,
		errors,
		errorLimit,
		feedbackLimit,
		pmfMetrics,
		productFeedback
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
			return fail(400, { message: translate(locals.locale, 'admin.logoutConfirmRequired') });
		}

		const sessionCount = await locals.adminService.logoutAllUsers();
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		redirect(
			302,
			`/login?message=${encodeURIComponent(translate(locals.locale, 'admin.loggedOutAll', { count: sessionCount }))}`
		);
	},
	logoutUser: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsed = adminUserIdSchema.safeParse({
			userId: formData.get('userId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.invalidUser') });
		}

		await locals.adminService.logoutUser(parsed.data.userId);

		if (parsed.data.userId === locals.user!.id) {
			const sessionCookie = lucia.createBlankSessionCookie();
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});
			redirect(302, '/login?message=' + encodeURIComponent(translate(locals.locale, 'admin.loggedOut')));
		}

		redirect(302, '/admin');
	}
};
