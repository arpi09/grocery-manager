import type { SubmitFunction } from '@sveltejs/kit';

/** SvelteKit `use:enhance` helper — toggles submitting while the action runs. */
export function bindSubmitting(setSubmitting: (value: boolean) => void): SubmitFunction {
	return () => {
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
				await onRedirect(result.location);
				return;
			}
			await update();
		};
	};
}
