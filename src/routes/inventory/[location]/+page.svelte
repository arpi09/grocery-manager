<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import LocationTab from '$lib/components/molecules/LocationTab.svelte';
	import InventoryList from '$lib/components/organisms/InventoryList.svelte';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	let { data } = $props();

	const inventoryPath = $derived(`/inventory/${data.location}`);
	const from = $derived(encodeURIComponent(inventoryPath));
	const addItemHref = $derived(`/item/new?location=${data.location}&from=${from}`);
	const scanHref = $derived(`/scan?mode=barcode&location=${data.location}&from=${from}`);
	const photoRoundHref = $derived(`/inventory/foto?from=${from}`);

	const activeCount = $derived(data.activeTotal);
	const totalCount = $derived(data.activeTotal + data.autoExpiredTotal + data.finishedTotal);
	const hasInventory = $derived(totalCount > 0);

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
	/>

	<PageContainer>
		<div class="inventory-page">
			<LocationTab active={data.location} />

			{#if data.canWrite && hasInventory}
				<div class="action-row">
					<a class="scan-primary" href={scanHref}>
						<FeatureIcon id="barcode" size={18} />
						{t('inventory.scanItem')}
					</a>
					<a class="manual-secondary" href={addItemHref} data-sveltekit-reload>
						{t('inventory.addManual')}
					</a>
				</div>
				<a class="photo-round-link" href={photoRoundHref}>
					{t('inventory.photoRound')}
				</a>
			{/if}

			<InventoryList
				items={data.items}
				activeTotal={data.activeTotal}
				autoExpiredTotal={data.autoExpiredTotal}
				finishedTotal={data.finishedTotal}
				autoExpiredGraceDays={data.autoExpiredGraceDays}
				location={data.location}
				canWrite={data.canWrite}
				{hasInventory}
			/>
		</div>
	</PageContainer>
</AppLayout>

<style>
	.inventory-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.action-row {
		display: flex;
		align-items: stretch;
		gap: var(--space-sm);
	}

	.scan-primary {
		flex: 1 1 60%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		min-height: 2.75rem;
		padding: 0.65rem 1rem;
		font-weight: 700;
		font-size: 0.95rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		background: var(--color-primary);
		color: #fff;
		box-shadow: var(--shadow-sm);
	}

	.scan-primary:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.manual-secondary {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.65rem 0.85rem;
		font-weight: 600;
		font-size: 0.85rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text-muted);
		background: transparent;
		border: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.manual-secondary:hover {
		color: var(--color-text);
		border-color: var(--color-border);
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.photo-round-link {
		align-self: flex-start;
		min-height: 2.75rem;
		padding: 0.35rem 0.15rem;
		font-weight: 600;
		font-size: 0.875rem;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		color: var(--color-primary);
	}

	.photo-round-link:hover {
		color: var(--color-primary-hover);
		text-decoration: none;
	}

	@media (min-width: 560px) {
		.action-row {
			max-width: 28rem;
		}
	}
</style>
