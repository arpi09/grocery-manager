import type { ToastSize, ToastVariant } from '$lib/components/molecules/Toast.svelte';
import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';

export type ClientToastPayload = {
	id: number;
	message: string;
	variant: ToastVariant;
	size: ToastSize;
	durationMs: number;
};

/** Global client toast — same placement and timing as ActionToast (see AppLayout). */
export const clientToastStore = $state<{ toast: ClientToastPayload | null }>({ toast: null });

let sequence = 0;

export function getClientToast(): ClientToastPayload | null {
	return clientToastStore.toast;
}

export function showClientToast(
	message: string,
	options?: {
		variant?: ToastVariant;
		size?: ToastSize;
		durationMs?: number;
	}
): void {
	const trimmed = message.trim();
	if (!trimmed) {
		return;
	}

	sequence += 1;
	clientToastStore.toast = {
		id: sequence,
		message: trimmed,
		variant: options?.variant ?? 'success',
		size: options?.size ?? 'action',
		durationMs: options?.durationMs ?? TOAST_DEFAULT_DURATION_MS
	};
}

export function dismissClientToast(): void {
	clientToastStore.toast = null;
}
