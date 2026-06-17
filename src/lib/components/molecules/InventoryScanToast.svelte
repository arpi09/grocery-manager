<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast, { type ToastVariant } from '$lib/components/molecules/Toast.svelte';
	import { getLocale } from '$lib/i18n';
	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';
	import {
		clearReceiptImportToastPending,
		isReceiptImportToastPending
	} from '$lib/utils/receipt-import-session';
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

	const message = $derived.by(() => {
		if (!toastKind || isReceiptImportToastPending()) return '';
		return scanToastMessage(getLocale(), toastKind, productName);
	});
	const visible = $derived(Boolean(toastKind && message && !dismissed));

	const variant = $derived.by((): ToastVariant => (toastKind === 'unknown' ? 'info' : 'success'));

	function clearToastParam() {
		const url = new URL(page.url);
		url.searchParams.delete(SCAN_TOAST_PARAM);
		url.searchParams.delete(SCAN_TOAST_NAME_PARAM);
		void goto(`${url.pathname}${url.search}${url.hash}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleDismiss() {
		dismissed = true;
		clearReceiptImportToastPending();
		clearToastParam();
	}
</script>

<Toast {message} {visible} {variant} size="action" durationMs={TOAST_DEFAULT_DURATION_MS} tapToDismiss={true} onDismiss={handleDismiss} />
