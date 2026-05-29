<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Skanna" subtitle="Lägg till vara med streckkod" />
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				Du har endast läsbehörighet i detta hushåll och kan inte lägga till varor.
			</p>
		{:else}
			<ScanToAddFlow
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				errors={form?.errors}
			/>
		{/if}
		<p class="back">
			<a href={data.returnTo}>← Tillbaka</a>
		</p>
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		margin: 0;
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}

	.back {
		margin: var(--space-lg) 0 0;
	}

	.back a {
		color: var(--color-text-muted);
		font-weight: 600;
	}
</style>
