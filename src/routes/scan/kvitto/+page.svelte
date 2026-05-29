<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ReceiptBulkAddFlow from '$lib/components/organisms/ReceiptBulkAddFlow.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Skanna kvitto" subtitle="Lägg till flera varor på en gång" />
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				Du har endast läsbehörighet och kan inte lägga till varor från kvitto.
			</p>
			<p><a href={data.returnTo}>← Tillbaka</a></p>
		{:else}
			<ReceiptBulkAddFlow returnTo={data.returnTo} />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}
</style>
