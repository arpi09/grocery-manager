import { goto, invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

async function navigateAfterRedirect(location: string): Promise<void> {
	await goto(location, { replaceState: true, keepFocus: true, noScroll: true, invalidateAll: true });
}

async function updatePreservingScroll(
	update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>,
	options?: { reset?: boolean; invalidateAll?: boolean }
): Promise<void> {
	const scrollY = window.scrollY;
	await update(options);
	requestAnimationFrame(() => {
		window.scrollTo(0, scrollY);
	});
}

/** SvelteKit `use:enhance` helper — toggles submitting while the action runs. */
export function bindSubmitting(
	setSubmitting: (value: boolean) => void,
	syncFormData?: (formData: FormData) => void
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ result, update }) => {
			try {
				if (result.type === 'redirect') {
					await navigateAfterRedirect(result.location);
					return;
				}
				await updatePreservingScroll(update);
			} finally {
				setSubmitting(false);
			}
		};
	};
}

/** Like `bindSubmitting`, but invokes a callback after a successful non-redirect result. */
export function bindSubmittingWithToast(
	setSubmitting: (value: boolean) => void,
	onSuccess: () => void,
	syncFormData?: (formData: FormData) => void,
	options?: { invalidateAll?: boolean }
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ result, update }) => {
			try {
				await updatePreservingScroll(update, options);
				if (result.type === 'success') {
					onSuccess();
				}
			} finally {
				setSubmitting(false);
			}
		};
	};
}

/** Like `bindSubmitting`, but handles redirect results without a full page reload. */
export function bindSubmittingWithRedirect(
	setSubmitting: (value: boolean) => void,
	onRedirect: (location: string) => Promise<void>,
	syncFormData?: (formData: FormData) => void
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ result, update }) => {
			try {
				if (result.type === 'redirect') {
					await onRedirect(result.location);
					await navigateAfterRedirect(result.location);
					return;
				}
				await updatePreservingScroll(update, { invalidateAll: true });
			} finally {
				setSubmitting(false);
			}
		};
	};
}
