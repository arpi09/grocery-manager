import { describe, expect, it, beforeEach } from 'vitest';
import {
	dismissClientToast,
	getClientToast,
	showClientToast
} from './client-toast.svelte';
import { TOAST_DEFAULT_DURATION_MS } from './action-toast';

describe('client-toast', () => {
	beforeEach(() => {
		dismissClientToast();
	});

	it('shows and dismisses a toast with defaults', () => {
		showClientToast('Saved');
		const toast = getClientToast();
		expect(toast?.message).toBe('Saved');
		expect(toast?.variant).toBe('success');
		expect(toast?.size).toBe('action');
		expect(toast?.durationMs).toBe(TOAST_DEFAULT_DURATION_MS);

		dismissClientToast();
		expect(getClientToast()).toBeNull();
	});

	it('ignores empty messages', () => {
		showClientToast('   ');
		expect(getClientToast()).toBeNull();
	});

	it('replaces the previous toast', () => {
		showClientToast('First');
		showClientToast('Second');
		expect(getClientToast()?.message).toBe('Second');
		expect(getClientToast()?.id).toBeGreaterThan(1);
	});

	it('supports celebrate styling and onDismiss callback', () => {
		let dismissed = false;
		showClientToast('Milestone', { celebrate: true, onDismiss: () => (dismissed = true) });
		expect(getClientToast()?.celebrate).toBe(true);

		dismissClientToast();
		expect(getClientToast()).toBeNull();
		expect(dismissed).toBe(true);
	});
});
