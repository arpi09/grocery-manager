<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeHub from '$lib/components/molecules/ScanModeHub.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';

	let { data, form } = $props();
</script>

<AppLayout user={data.user}>
	<AppHeader title="Skanna" subtitle="Välj hur du vill lägga till varor" />
	<PageContainer>
		{#if data.canWrite}
			<ScanModeHub returnTo={data.returnTo} defaultLocation={data.defaultLocation} />
		{/if}
		{#if !data.canWrite}
			<p class="readonly" role="status">
				Du har endast läsbehörighet i detta hushåll och kan inte lägga till varor.
			</p>
		{:else}
			<section class="barcode-section" aria-labelledby="barcode-scan-heading">
				<h2 id="barcode-scan-heading">Streckkod</h2>
				<ScanToAddFlow
					defaultLocation={data.defaultLocation}
					returnTo={data.returnTo}
					errors={form?.errors}
				/>
			</section>
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

	.barcode-section {
		margin-top: var(--space-lg);
	}

	.barcode-section h2 {
		margin: 0 0 var(--space-md);
		font-size: 1.1rem;
	}

	.back {
		margin: var(--space-md) 0 0;
	}

	.back a {
		color: var(--color-text-muted);
		font-weight: 600;
	}
</style>
