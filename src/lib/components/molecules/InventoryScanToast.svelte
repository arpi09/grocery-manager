<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast, { type ToastVariant } from '$lib/components/molecules/Toast.svelte';
	import { getLocale } from '$lib/i18n';
	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';
	import {
		SCAN_TOAST_NAME_PARAM,
		SCAN_TOAST_PARAM,
		parseScanToastKind,
		scanToastMessage
	} from '$lib/utils/scan-toast';

	let dismissed = $state(false);

	const toastKind = $derived(parseScanToastKind(page.url.searchParams.get(SCAN_TOAST_PARAM)));
	const productName = $derived(page.url.searchParams.get(SCAN_TOAST_NAME_PARAM) ?? '');

	$effect(() => {
		void toastKind;
		void productName;
		dismissed = false;
	});

	const message = $derived(
		toastKind ? scanToastMessage(getLocale(), toastKind, productName) : ''
	);
	const visible = $derived(Boolean(toastKind && message && !dismissed));

	const variant = $derived.by((): ToastVariant => {
		if (toastKind === 'unknown') {
			return 'info';
		}
		return 'success';
	});

	function clearToastParam() {
		const url = new URL(page.url);
		url.searchParams.delete(SCAN_TOAST_PARAM);
		url.searchParams.delete(SCAN_TOAST_NAME_PARAM);
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
	durationMs={TOAST_DEFAULT_DURATION_MS}
	tapToDismiss={true}
	onDismiss={handleDismiss}
/>
