<script lang="ts">
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { clientToastStore, dismissClientToast } from '$lib/utils/client-toast.svelte';
</script>

{#if clientToastStore.toast}
	<Toast
		message={clientToastStore.toast.message}
		visible={true}
		variant={clientToastStore.toast.variant}
		size={clientToastStore.toast.size}
		durationMs={clientToastStore.toast.durationMs}
		onDismiss={dismissClientToast}
	/>
{/if}
