<script lang="ts">
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { clientToastStore, dismissClientToast } from '$lib/utils/client-toast.svelte';
	import { isReceiptImportToastPending } from '$lib/utils/receipt-import-session';
</script>

{#if clientToastStore.toast && !isReceiptImportToastPending()}
	<Toast
		message={clientToastStore.toast.message}
		visible={true}
		variant={clientToastStore.toast.variant}
		size={clientToastStore.toast.size}
		durationMs={clientToastStore.toast.durationMs}
		celebrate={clientToastStore.toast.celebrate ?? false}
		tapToDismiss={true}
		onDismiss={dismissClientToast}
	/>
{/if}
