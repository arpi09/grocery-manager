<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ScanModeHub from '$lib/components/molecules/ScanModeHub.svelte';
	import ScanModeTabs from '$lib/components/molecules/ScanModeTabs.svelte';
	import ScanToAddFlow from '$lib/components/organisms/ScanToAddFlow.svelte';
	import ReceiptBulkAddFlow from '$lib/components/organisms/ReceiptBulkAddFlow.svelte';
	import PhotoRoundFlow from '$lib/components/organisms/PhotoRoundFlow.svelte';
	import ScanFlowFooter from '$lib/components/molecules/ScanFlowFooter.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref, type ScanMode } from '$lib/utils/scan-nav';

	let { data, form } = $props();

	const scanMode = $derived(data.scanMode as ScanMode);
	const isHub = $derived(scanMode === 'hub');
	const isBarcodeMode = $derived(scanMode === 'barcode');
	const isReceiptMode = $derived(scanMode === 'receipt');
	const isPhotoMode = $derived(scanMode === 'photo');
	const hubHref = $derived(scanHubHref(data.returnTo));

	const title = $derived(
		isBarcodeMode
			? t('scan.barcodeTitle')
			: isReceiptMode
				? t('scan.receiptPage.title')
				: isPhotoMode
					? t('photoRound.title')
					: t('scan.title')
	);
	const subtitle = $derived(
		isBarcodeMode
			? t('scan.barcodeSubtitle')
			: isReceiptMode
				? t('scan.receiptPage.subtitle')
				: isPhotoMode
					? t('photoRound.subtitle')
					: t('scan.subtitle')
	);
	const cancelLabel = $derived(isHub ? t('scan.cancel') : t('scan.cancelBack'));
	const backHref = $derived(isHub ? data.returnTo : hubHref);
	const backLabel = $derived(isHub ? t('common.back') : t('scan.allModes'));
	const activeTab = $derived(
		isBarcodeMode ? 'barcode' : isReceiptMode ? 'receipt' : isPhotoMode ? 'photoRound' : 'hub'
	);
</script>

<AppLayout user={data.user}>
	<AppHeader {title} {subtitle} {backHref} {backLabel} />
	<PageContainer>
		{#if !isHub}
			<ScanModeTabs
				active={activeTab}
				returnTo={data.returnTo}
				defaultLocation={data.defaultLocation}
			/>
		{/if}
		{#if !data.canWrite}
			<p class="readonly" role="status">
				{isReceiptMode
					? t('scan.receiptPage.readonly')
					: isPhotoMode
						? t('inventory.readonly')
						: t('scan.readonly')}
			</p>
		{:else if isBarcodeMode}
			<ScanToAddFlow
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				cancelHref={data.returnTo}
				errors={form?.errors}
			/>
			<ScanFlowFooter cancelHref={data.returnTo} cancelLabel={t('scan.cancelBack')} />
		{:else if isReceiptMode}
			<ReceiptBulkAddFlow returnTo={data.returnTo} />
		{:else if isPhotoMode}
			<PhotoRoundFlow returnTo={data.returnTo} />
			<ScanFlowFooter cancelHref={data.returnTo} cancelLabel={t('scan.cancel')} />
		{:else}
			<ScanModeHub returnTo={data.returnTo} defaultLocation={data.defaultLocation} />
			<ScanFlowFooter cancelHref={data.returnTo} {cancelLabel} />
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
