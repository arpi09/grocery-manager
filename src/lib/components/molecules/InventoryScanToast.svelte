<script lang="ts">
	import { page } from '$app/stores';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import {
		SCAN_TOAST_NAME_PARAM,
		SCAN_TOAST_PARAM,
		parseScanToastKind,
		scanToastMessage
	} from '$lib/utils/scan-toast';
	import { goto } from '$app/navigation';

	let dismissed = $state(false);

	const toastKind = $derived(parseScanToastKind($page.url.searchParams.get(SCAN_TOAST_PARAM)));
	const productName = $derived($page.url.searchParams.get(SCAN_TOAST_NAME_PARAM) ?? '');
	const message = $derived(
		toastKind ? scanToastMessage(toastKind, productName) : ''
	);
	const visible = $derived(Boolean(toastKind && message && !dismissed));

	function clearToastParam() {
		const url = new URL($page.url);
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

<Toast {message} {visible} onDismiss={handleDismiss} />
