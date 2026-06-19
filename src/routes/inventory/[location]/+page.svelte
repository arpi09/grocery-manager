<script lang="ts">

	import { page } from '$app/state';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import InventoryAddSheet from '$lib/components/molecules/InventoryAddSheet.svelte';
	import PantryLocationDataGrid from '$lib/components/organisms/PantryLocationDataGrid.svelte';
	import { trackPantryItemOpened } from '$lib/client/pantry-v2-telemetry';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';
	import { parseInventoryExpiryFilter } from '$lib/utils/inventory-list-filters';



	let { data } = $props();



	const inventoryPath = $derived(`/inventory/${data.location}`);

	const scanReceiptHref = $derived(scanModeHref('receipt', inventoryPath));
	const scanPhotoHref = $derived(scanModeHref('photo', inventoryPath, { location: data.location }));
	const scanBarcodeHref = $derived(scanModeHref('barcode', inventoryPath, { location: data.location }));
	const manualHref = $derived(manualAddHref(inventoryPath, { location: data.location }));

	let addSheetOpen = $state(false);



	const activeCount = $derived(data.activeTotal);

	const totalCount = $derived(data.activeTotal + data.autoExpiredTotal + data.finishedTotal);

	const hasInventory = $derived(totalCount > 0);
	const initialExpiryFilter = $derived(parseInventoryExpiryFilter(page.url.searchParams.get('filter')));

	const backHref = $derived(page.data.pantryUxV2Enabled ? '/inventory' : undefined);
	const backLabel = $derived(page.data.pantryUxV2Enabled ? t('dataGrid.backToPantry') : undefined);

	function handlePantryItemNavigate(itemId: string) {
		if (!page.data.pantryUxV2Enabled) {
			return;
		}

		trackPantryItemOpened(itemId, data.location, 'table');
	}



	const headerSubtitle = $derived(

		hasInventory

			? t('inventory.itemCountSubtitle', { count: activeCount })

			: t('inventory.subtitle')

	);

</script>



<AppLayout user={data.user}>

	<AppHeader

		title={locationLabel(getLocale(), data.location)}

		subtitle={headerSubtitle}

		{backHref}

		{backLabel}

	/>



	<PageContainer>

		<div class="inventory-page">
			{#if data.canWrite}
			<InventoryAddSheet
				open={addSheetOpen}
				receiptHref={scanReceiptHref}
				photoHref={scanPhotoHref}
				barcodeHref={scanBarcodeHref}
				manualHref={manualHref}
				onClose={() => (addSheetOpen = false)}
			/>
			{/if}

			{#if data.canWrite && initialExpiryFilter === 'noExpiry'}
				<form method="POST" action="?/bulkInferExpiry" class="bulk-expiry-banner">
					<p>{t('inventory.bulkExpiryBanner')}</p>
					<button type="submit">{t('inventory.bulkExpiryAction')}</button>
				</form>
			{/if}



			<PantryLocationDataGrid

				items={data.items}

				activeTotal={data.activeTotal}

				location={data.location}

				canWrite={data.canWrite}
				canConsume={data.canConsume}

				{hasInventory}
				onAddClick={data.canWrite ? () => (addSheetOpen = true) : undefined}
				onItemNavigate={handlePantryItemNavigate}

			/>

		</div>

	</PageContainer>

</AppLayout>



<style>

	.inventory-page {

		display: flex;

		flex-direction: column;

		gap: var(--space-lg);

		min-width: 0;

	}



	.bulk-expiry-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
	}

	.bulk-expiry-banner p {
		margin: 0;
		font-size: 0.875rem;
	}

</style>

