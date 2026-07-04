<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PantryLocationDataGrid from '$lib/components/organisms/PantryLocationDataGrid.svelte';
	import { trackPantryItemOpened } from '$lib/client/pantry-v2-telemetry';
	import type { StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const activeCount = $derived(data.activeTotal);
	const totalCount = $derived(data.activeTotal);
	const hasInventory = $derived(totalCount > 0);

	const backHref = '/inventory';
	const backLabel = $derived(t('dataGrid.backToPantry'));

	function handlePantryItemNavigate(itemId: string, itemLocation?: StorageLocation) {
		trackPantryItemOpened(itemId, itemLocation ?? 'fridge', 'table');
	}

	const headerSubtitle = $derived(
		hasInventory
			? t('inventory.itemCountSubtitle', { count: activeCount })
			: t('inventory.subtitle')
	);
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('inventory.allTitle')}
		subtitle={headerSubtitle}
		{backHref}
		{backLabel}
	/>

	<PageContainer>
		<div class="inventory-page" data-testid="pantry-all-locations-page">
			<PantryLocationDataGrid
				items={data.items}
				activeTotal={data.activeTotal}
				allLocations
				canWrite={data.canWrite}
				canConsume={data.canConsume}
				{hasInventory}
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
