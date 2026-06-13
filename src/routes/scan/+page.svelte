<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
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
	import { getLastScanMode } from '$lib/utils/last-scan-defaults';
	import { scanModeHref, type ScanMode } from '$lib/utils/scan-nav';

	let { data, form } = $props();

	$effect(() => {
		if (!browser || !data.needsSmartDefault) {
			return;
		}
		const mode = getLastScanMode();
		if (mode !== 'photo') {
			void goto(scanModeHref(mode, data.returnTo, data.defaultLocation ? { location: data.defaultLocation } : undefined), {
				replaceState: true
			});
		}
	});

	const scanMode = $derived(data.scanMode as ScanMode);
	const isHub = $derived(scanMode === 'hub');
	const isBarcodeMode = $derived(scanMode === 'barcode');
	const isReceiptMode = $derived(scanMode === 'receipt');
	const isPhotoMode = $derived(scanMode === 'photo');
	const isTopLevelEntry = $derived(data.isTopLevelEntry);

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
	const backHref = $derived(isTopLevelEntry ? undefined : data.returnTo);
	const backLabel = $derived(t('common.back'));
	const activeTab = $derived(
		isBarcodeMode ? 'barcode' : isReceiptMode ? 'receipt' : isPhotoMode ? 'photoRound' : null
	);
</script>

<AppLayout user={data.user}>
	<AppHeader {title} {subtitle} {backHref} {backLabel} />
	<PageContainer>
		{#if data.canWrite && !isHub}
			<ScanModeTabs
				active={activeTab}
				returnTo={data.returnTo}
				defaultLocation={data.defaultLocation ?? undefined}
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
				defaultLocation={data.defaultLocation ?? 'fridge'}
				returnTo={data.returnTo}
				cancelHref={isTopLevelEntry ? undefined : data.returnTo}
				errors={form?.errors}
			/>
		{:else if isReceiptMode}
			<ReceiptBulkAddFlow
				returnTo={data.returnTo}
				shelfLifeEstimatesInReceipt={data.shelfLifeEstimatesInReceipt}
			/>
		{:else if isPhotoMode}
			<PhotoRoundFlow returnTo={data.returnTo} initialLocation={data.defaultLocation} />
		{:else}
			<ScanModeHub returnTo={data.returnTo} defaultLocation={data.defaultLocation ?? undefined} />
			{#if !isTopLevelEntry}
				<ScanFlowFooter cancelHref={data.returnTo} {cancelLabel} />
			{/if}
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
