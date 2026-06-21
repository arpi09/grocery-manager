import { clearThemeCookie } from '$lib/infrastructure/theme-cookie';
import { mapAccountErrorToFail } from '$lib/application/account-errors';
import { invalidateSession } from '$lib/server/session';
import { translate } from '$lib/i18n/messages';
import { deleteAccountSchema } from '$lib/validation/account.schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const accountActions = {
	deleteAccount: async (event: RequestEvent) => {
		const { request, locals } = event;
		const formData = await request.formData();
		const parsed = deleteAccountSchema.safeParse({
			confirmText: formData.get('confirmText')
		});

		if (!parsed.success) {
			const confirmError = parsed.error.flatten().fieldErrors.confirmText?.[0];
			return fail(400, {
				accountError:
					confirmError === 'Skriv RADERA för att bekräfta'
						? translate(locals.locale, 'errors.account.deleteConfirm')
						: translate(locals.locale, 'errors.account.deleteConfirm')
			});
		}

		try {
			await locals.accountService.deleteAccount(locals.user!.id, parsed.data.confirmText);
		} catch (error) {
			return mapAccountErrorToFail(error, locals.locale);
		}

		await invalidateSession(event);
		clearThemeCookie(event.cookies);
		event.locals.user = null;
		event.locals.session = null;

		redirect(302, '/login?deleted=1');
	}
};
