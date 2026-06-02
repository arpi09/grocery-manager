<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeHub from '$lib/components/molecules/ScanModeHub.svelte';
	import ScanModeTabs from '$lib/components/molecules/ScanModeTabs.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	let { data, form } = $props();

	const isBarcodeMode = $derived(data.scanMode === 'barcode');
	const hubHref = $derived(scanHubHref(data.returnTo));

	const title = $derived(isBarcodeMode ? t('scan.barcodeTitle') : t('scan.title'));
	const subtitle = $derived(
		isBarcodeMode ? t('scan.barcodeSubtitle') : t('scan.subtitle')
	);
	const cancelLabel = $derived(isBarcodeMode ? t('scan.cancelBack') : t('scan.cancel'));
	const backHref = $derived(isBarcodeMode ? hubHref : data.returnTo);
	const backLabel = $derived(isBarcodeMode ? t('scan.allModes') : t('common.back'));
</script>

<AppLayout user={data.user}>
	<AppHeader
		{title}
		{subtitle}
		{backHref}
		{backLabel}
	/>
	<PageContainer>
		<ScanModeTabs
			active={isBarcodeMode ? 'barcode' : 'hub'}
			returnTo={data.returnTo}
			defaultLocation={data.defaultLocation}
		/>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				{t('scan.readonly')}
			</p>
		{:else if isBarcodeMode}
			<ScanToAddFlow
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				cancelHref={data.returnTo}
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
