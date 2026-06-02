// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { bindSubmitting } from './form-submit-feedback';

function submitArgs(formData: FormData) {
	return {
		formData,
		formElement: document.createElement('form'),
		action: new URL('http://localhost/settings'),
		controller: new AbortController(),
		cancel: () => {},
		submitter: null
	};
}

describe('bindSubmitting', () => {
	it('calls syncFormData on the submitted FormData before marking submitting', () => {
		const setSubmitting = vi.fn();
		const syncFormData = vi.fn((fd: FormData) => {
			fd.set('enabled', 'true');
		});
		const submit = bindSubmitting(setSubmitting, syncFormData);
		const formData = new FormData();
		formData.set('enabled', 'false');

		submit(submitArgs(formData));

		expect(syncFormData).toHaveBeenCalledWith(formData);
		expect(formData.get('enabled')).toBe('true');
		expect(setSubmitting).toHaveBeenCalledWith(true);
	});

	it('simulates toggle race: stale hidden input corrected at enhance time', () => {
		let enabled = false;
		const submit = bindSubmitting(
			() => {},
			(formData) => formData.set('enabled', enabled ? 'true' : 'false')
		);
		const formData = new FormData();
		formData.set('enabled', 'false');

		enabled = true;
		submit(submitArgs(formData));

		expect(formData.get('enabled')).toBe('true');
	});
});
