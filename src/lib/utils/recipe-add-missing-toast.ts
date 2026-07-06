import { showClientToast } from '$lib/utils/client-toast.svelte';
import {
	presentAddMissingFeedback,
	type AddMissingApiResult,
	type AddMissingFeedbackPresentation
} from '$lib/utils/recipe-add-missing';
import type { Locale } from '$lib/i18n';

/**
 * Present an add-missing API result: fire a client toast (optionally suffixed with a
 * "view shopping list" link label) and return the inline-banner presentation.
 *
 * Shared by the recipe assistant, the planner ideas panel and the calendar day sheet —
 * they previously copy-pasted this present → toast → banner block. Pass `listLinkLabel`
 * to append the link when the API actually added items (the panels do; the assistant
 * intentionally omits it).
 */
export function toastAddMissingResult(
	locale: Locale,
	result: AddMissingApiResult,
	options?: { listLinkLabel?: string }
): AddMissingFeedbackPresentation {
	const presented = presentAddMissingFeedback(locale, result);
	const variant =
		presented.tone === 'error' ? 'error' : presented.tone === 'warning' ? 'info' : 'success';
	const message =
		options?.listLinkLabel && presented.showListLink
			? `${presented.message} ${options.listLinkLabel}`
			: presented.message;
	showClientToast(message, { variant });
	return presented;
}
