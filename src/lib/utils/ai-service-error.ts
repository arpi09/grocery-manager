import { t } from '$lib/i18n';

export function aiServiceErrorMessage(
	status: number,
	serverError?: string | null,
	fallbackKey: 'recipe.generateFailed' | 'weeklyRitual.generateFailed' = 'recipe.generateFailed'
): string {
	if (serverError?.trim()) {
		return serverError;
	}
	if (status === 401) {
		return t('recipe.notLoggedIn');
	}
	if (status === 422) {
		return t('recipe.parseFailed');
	}
	if (status === 503) {
		return t('recipe.serviceUnavailable');
	}
	if (status === 502) {
		return t('recipe.reachFailed');
	}
	return t(fallbackKey);
}
