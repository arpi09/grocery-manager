import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

/** Form enhance helper for scan flows embedded in onboarding — no redirect navigation. */
export function bindEmbeddedScanSubmit(
	setSubmitting: (value: boolean) => void,
	onSuccess: () => void,
	syncFormData?: (formData: FormData) => void
): SubmitFunction {
	return ({ formData }) => {
		syncFormData?.(formData);
		setSubmitting(true);
		return async ({ result, update }) => {
			try {
				if (result.type === 'redirect') {
					onSuccess();
					await invalidateAll();
					return;
				}
				if (result.type === 'success') onSuccess();
				await update({ invalidateAll: true });
			} finally {
				setSubmitting(false);
			}
		};
	};
}
