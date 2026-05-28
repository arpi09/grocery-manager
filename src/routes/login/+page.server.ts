import { AuthError } from '$lib/application/auth.service';
import { loginSchema } from '$lib/validation/auth.schemas';
import { createSession } from '$lib/server/session';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	login: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parsed = loginSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				errors: parsed.error.flatten().fieldErrors,
				message: 'Please fix the errors below.',
				email: String(formData.email ?? '')
			});
		}

		try {
			const user = await event.locals.authService.login(parsed.data.email, parsed.data.password);
			await createSession(event, user.id);
		} catch (error) {
			if (error instanceof AuthError) {
				return fail(400, {
					errors: {},
					message: error.message,
					email: parsed.data.email
				});
			}
			throw error;
		}

		redirect(302, '/');
	}
};
