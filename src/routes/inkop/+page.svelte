<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import InkopAssistant from '$lib/components/organisms/InkopAssistant.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Inköp" subtitle="Smart inventariehjälp och ICA-lista" />
	<PageContainer>
		<InkopAssistant />
	</PageContainer>
</AppLayout>
