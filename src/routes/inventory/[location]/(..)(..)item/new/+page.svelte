<script lang="ts">
	import { goto } from '$app/navigation';
	import AddItemModalOverlay from '$lib/components/organisms/AddItemModalOverlay.svelte';

	let { data, form } = $props();

	function closeAddItem() {
		void goto(data.returnTo);
	}
</script>

<AddItemModalOverlay
	defaultLocation={data.defaultLocation}
	errors={form?.errors}
	onClose={closeAddItem}
/>
