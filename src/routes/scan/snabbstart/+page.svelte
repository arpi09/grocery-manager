<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import StarterPackFlow from '$lib/components/organisms/StarterPackFlow.svelte';

	let { data } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Snabbstart" subtitle="Markera det du har hemma" />
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">Du har endast läsbehörighet.</p>
			<p><a href={data.returnTo}>← Tillbaka</a></p>
		{:else}
			<StarterPackFlow returnTo={data.returnTo} />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
	}
</style>
