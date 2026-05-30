<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeHub from '$lib/components/molecules/ScanModeHub.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import { t } from '$lib/i18n';

	let { data, form } = $props();

	const fromEncoded = $derived(encodeURIComponent(data.returnTo));
	const locationQuery = $derived(
		data.defaultLocation ? `&location=${data.defaultLocation}` : ''
	);
	const hubHref = $derived(`/scan?from=${fromEncoded}${locationQuery}`);
	const isBarcodeMode = $derived(data.scanMode === 'barcode');

	const title = $derived(isBarcodeMode ? t('scan.barcodeTitle') : t('scan.title'));
	const subtitle = $derived(
		isBarcodeMode ? t('scan.barcodeSubtitle') : t('scan.subtitle')
	);
	const backLabel = $derived(isBarcodeMode ? t('scan.allModes') : t('common.back'));
	const cancelLabel = $derived(isBarcodeMode ? t('scan.cancelBack') : t('scan.cancel'));
</script>

<AppLayout user={data.user}>
	<AppHeader
		{title}
		{subtitle}
		backHref={isBarcodeMode ? hubHref : data.returnTo}
		{backLabel}
	/>
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				{t('scan.readonly')}
			</p>
		{:else if isBarcodeMode}
			<ScanToAddFlow
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				cancelHref={hubHref}
				errors={form?.errors}
			/>
			<ScanFlowFooter cancelHref={data.returnTo} {cancelLabel} />
		{:else}
			<ScanModeHub returnTo={data.returnTo} defaultLocation={data.defaultLocation} />
			<ScanFlowFooter cancelHref={data.returnTo} cancelLabel={t('scan.cancel')} />
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
