<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { getLocale } from '$lib/i18n';
	import {
		ACTION_TOAST_LABEL_PARAM,
		ACTION_TOAST_PARAM,
		actionToastMessage,
		parseActionToastKind
	} from '$lib/utils/action-toast';

	let dismissed = $state(false);

	const toastKind = $derived(parseActionToastKind(page.url.searchParams.get(ACTION_TOAST_PARAM)));
	const label = $derived(page.url.searchParams.get(ACTION_TOAST_LABEL_PARAM) ?? undefined);
	const message = $derived(
		toastKind ? actionToastMessage(getLocale(), toastKind, label) : ''
	);
	const visible = $derived(Boolean(toastKind && message && !dismissed));

	function clearToastParam() {
		const url = new URL(page.url);
		url.searchParams.delete(ACTION_TOAST_PARAM);
		url.searchParams.delete(ACTION_TOAST_LABEL_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleDismiss() {
		dismissed = true;
		clearToastParam();
	}
</script>

<Toast {message} {visible} onDismiss={handleDismiss} />
