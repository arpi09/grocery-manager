<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast, { type ToastVariant } from '$lib/components/molecules/Toast.svelte';
	import { getLocale } from '$lib/i18n';
	import {
		ACTION_TOAST_LABEL_PARAM,
		ACTION_TOAST_PARAM,
		ACTION_TOAST_REMAINING_PARAM,
		actionToastMessage,
		actionToastTone,
		parseActionToastKind
	} from '$lib/utils/action-toast';

	const ACTION_TOAST_DURATION_MS = 5500;

	let dismissed = $state(false);

	const toastKind = $derived(parseActionToastKind(page.url.searchParams.get(ACTION_TOAST_PARAM)));
	const label = $derived(page.url.searchParams.get(ACTION_TOAST_LABEL_PARAM) ?? undefined);
	const remaining = $derived(page.url.searchParams.get(ACTION_TOAST_REMAINING_PARAM) ?? undefined);

	$effect(() => {
		void toastKind;
		void label;
		void remaining;
		dismissed = false;
	});
	const message = $derived(
		toastKind ? actionToastMessage(getLocale(), toastKind, label, remaining) : ''
	);
	const visible = $derived(Boolean(toastKind && message && !dismissed));

	const variant = $derived.by((): ToastVariant => {
		if (!toastKind) {
			return 'default';
		}
		const tone = actionToastTone(toastKind);
		if (tone === 'success') {
			return 'success';
		}
		if (tone === 'info') {
			return 'info';
		}
		return 'default';
	});

	function clearToastParam() {
		const url = new URL(page.url);
		url.searchParams.delete(ACTION_TOAST_PARAM);
		url.searchParams.delete(ACTION_TOAST_LABEL_PARAM);
		url.searchParams.delete(ACTION_TOAST_REMAINING_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleDismiss() {
		dismissed = true;
		clearToastParam();
	}
</script>

<Toast
	{message}
	{visible}
	{variant}
	size="action"
	durationMs={ACTION_TOAST_DURATION_MS}
	tapToDismiss={true}
	onDismiss={handleDismiss}
/>
