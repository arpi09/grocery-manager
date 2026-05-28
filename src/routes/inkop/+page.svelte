<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import InkopAssistant from '$lib/components/organisms/InkopAssistant.svelte';

	let { data } = $props();
</script>

<AppLayout>
	<AppHeader
		title="Inköp"
		subtitle="Smart inventariehjälp och ICA-lista"
		user={data.user}
	/>
	<InkopAssistant />
</AppLayout>
