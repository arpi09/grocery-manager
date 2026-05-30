<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeHub from '$lib/components/molecules/ScanModeHub.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';

	let { data, form } = $props();

	const fromEncoded = $derived(encodeURIComponent(data.returnTo));
	const locationQuery = $derived(
		data.defaultLocation ? `&location=${data.defaultLocation}` : ''
	);
	const hubHref = $derived(`/scan?from=${fromEncoded}${locationQuery}`);
	const isBarcodeMode = $derived(data.scanMode === 'barcode');
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={isBarcodeMode ? 'Streckkod' : 'Skanna'}
		subtitle={isBarcodeMode
			? 'Rikta kameran mot streckkoden på förpackningen'
			: 'Välj hur du vill lägga till varor'}
		backHref={isBarcodeMode ? hubHref : data.returnTo}
		backLabel={isBarcodeMode ? 'Alla skanningslägen' : 'Tillbaka'}
	/>
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				Du har endast läsbehörighet i detta hushåll och kan inte lägga till varor.
			</p>
		{:else if isBarcodeMode}
			<ScanToAddFlow
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				cancelHref={hubHref}
				errors={form?.errors}
			/>
			<ScanFlowFooter cancelHref={data.returnTo} cancelLabel="Avbryt och gå tillbaka" />
		{:else}
			<ScanModeHub returnTo={data.returnTo} defaultLocation={data.defaultLocation} />
			<ScanFlowFooter cancelHref={data.returnTo} cancelLabel="Avbryt" />
		{/if}
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
</style>
