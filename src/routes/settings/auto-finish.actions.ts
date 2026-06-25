import { redirect } from '@sveltejs/kit';
import { appendActionToast } from '$lib/utils/action-toast';
import { userRepository } from '$lib/server/di';
import type { RequestEvent } from '@sveltejs/kit';

export const autoFinishActions = {
	toggleAutoFinishExpired: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const enabled = formData.get('enabled') === 'true';
		await userRepository.updateAutoFinishExpiredEnabled(locals.user!.id, enabled);
		redirect(302, appendActionToast('/settings/app', 'settingsSaved'));
	}
};
