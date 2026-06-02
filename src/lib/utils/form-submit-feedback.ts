import type { SubmitFunction } from '@sveltejs/kit';

/** SvelteKit `use:enhance` helper — toggles submitting while the action runs. */
export function bindSubmitting(
	setSubmitting: (value: boolean) => void,
	syncFormData?: (formData: FormData) => void
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ update }) => {
			try {
				await update();
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
	syncFormData?: (formData: FormData) => void
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ result, update }) => {
			try {
				await update();
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
	onRedirect: (location: string) => Promise<void>
): SubmitFunction {
	return () => {
		setSubmitting(true);
		return async ({ result, update }) => {
			setSubmitting(false);
			if (result.type === 'redirect') {
				await update({ invalidateAll: true });
				await onRedirect(result.location);
				return;
			}
			await update();
		};
	};
}
