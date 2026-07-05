<script lang="ts">

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import InventoryAddSheet from '$lib/components/molecules/InventoryAddSheet.svelte';
	import PantryLocationDataGrid from '$lib/components/organisms/PantryLocationDataGrid.svelte';
	import { trackPantryItemOpened } from '$lib/client/pantry-v2-telemetry';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';



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

	const backHref = '/inventory';
	const backLabel = $derived(t('dataGrid.backToPantry'));

	function handlePantryItemNavigate(itemId: string) {
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




</style>

