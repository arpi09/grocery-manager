import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('$lib/utils/client-toast.svelte', () => ({
	showClientToast: vi.fn()
}));

import { showClientToast } from '$lib/utils/client-toast.svelte';
import { toastAddMissingResult } from './recipe-add-missing-toast';
import type { AddMissingApiResult } from './recipe-add-missing';

const toast = vi.mocked(showClientToast);

const added: AddMissingApiResult = { ok: true, added: 2, skipped: 0 };
const nothingNew: AddMissingApiResult = { ok: true, added: 0, skipped: 3 };
const failed: AddMissingApiResult = { ok: false, added: 0, skipped: 0, error: 'Nätverksfel' };

describe('toastAddMissingResult', () => {
	beforeEach(() => toast.mockClear());

	it('appends the list-link label when items were added and a label is given (panels)', () => {
		const presented = toastAddMissingResult('sv', added, { listLinkLabel: 'Visa listan →' });

		expect(presented.showListLink).toBe(true);
		expect(presented.tone).toBe('success');
		expect(toast).toHaveBeenCalledTimes(1);
		const [message, opts] = toast.mock.calls[0];
		expect(message).toContain('Visa listan →');
		expect(opts).toEqual({ variant: 'success' });
	});

	it('omits the link suffix when no label is given (recipe assistant)', () => {
		toastAddMissingResult('sv', added);

		const [message, opts] = toast.mock.calls[0];
		expect(message).not.toContain('→');
		expect(opts).toEqual({ variant: 'success' });
	});

	it('never appends the link when nothing was added, even with a label', () => {
		const presented = toastAddMissingResult('sv', nothingNew, { listLinkLabel: 'Visa listan →' });

		expect(presented.showListLink).toBe(false);
		expect(presented.tone).toBe('warning');
		const [message, opts] = toast.mock.calls[0];
		expect(message).not.toContain('Visa listan →');
		// warning tone maps to the 'info' toast variant
		expect(opts).toEqual({ variant: 'info' });
	});

	it('maps a failed result to the error variant', () => {
		const presented = toastAddMissingResult('sv', failed, { listLinkLabel: 'Visa listan →' });

		expect(presented.tone).toBe('error');
		expect(presented.showListLink).toBe(false);
		expect(toast.mock.calls[0][1]).toEqual({ variant: 'error' });
	});
});
