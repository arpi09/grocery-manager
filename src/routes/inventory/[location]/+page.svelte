<script lang="ts">

	import { page } from '$app/state';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';

	import LocationTab from '$lib/components/molecules/LocationTab.svelte';

	import InventoryList from '$lib/components/organisms/InventoryList.svelte';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import { scanModeHref } from '$lib/utils/scan-nav';
	import { parseInventoryExpiryFilter } from '$lib/utils/inventory-list-filters';



	let { data } = $props();



	const inventoryPath = $derived(`/inventory/${data.location}`);

	const addItemHref = $derived(

		`/item/new?location=${data.location}&from=${encodeURIComponent(inventoryPath)}`

	);

	const photoScanHref = $derived(

		scanModeHref('photo', inventoryPath, { location: data.location })

	);

	const barcodeScanHref = $derived(

		scanModeHref('barcode', inventoryPath, { location: data.location })

	);

	const receiptScanHref = $derived(

		scanModeHref('receipt', inventoryPath, { location: data.location })

	);



	const activeCount = $derived(data.activeTotal);

	const totalCount = $derived(data.activeTotal + data.autoExpiredTotal + data.finishedTotal);

	const hasInventory = $derived(totalCount > 0);
	const initialShowAutoExpired = $derived(page.url.searchParams.get('autoExpired') === '1');
	const initialExpiryFilter = $derived(parseInventoryExpiryFilter(page.url.searchParams.get('filter')));



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
			<div class="inventory-sticky-tabs">
				<LocationTab active={data.location} />
			</div>

			{#if data.canWrite}

				<div class="add-goods-block" data-testid="inventory-add-goods">

					<a class="add-primary" href={photoScanHref}>

						<FeatureIcon id="photo" size={18} />

						{t('inventory.addGoods')}

					</a>

					<a class="barcode-action" href={barcodeScanHref}>{t('inventory.otherWaysBarcode')}</a>
				<a class="barcode-action" href={receiptScanHref}>{t('inventory.otherWaysReceipt')}</a>

					<details class="other-ways">

						<summary>{t('inventory.otherWays')}</summary>

						<nav class="other-ways-nav" aria-label={t('inventory.otherWays')}>

							<a href={addItemHref} data-sveltekit-reload>{t('inventory.otherWaysManual')}</a>

						</nav>

					</details>

				</div>

			{/if}

			{#if data.canWrite && initialExpiryFilter === 'noExpiry'}
				<form method="POST" action="?/bulkInferExpiry" class="bulk-expiry-banner">
					<p>{t('inventory.bulkExpiryBanner')}</p>
					<button type="submit">{t('inventory.bulkExpiryAction')}</button>
				</form>
			{/if}



			<InventoryList

				items={data.items}

				activeTotal={data.activeTotal}

				autoExpiredTotal={data.autoExpiredTotal}

				finishedTotal={data.finishedTotal}

				autoExpiredGraceDays={data.autoExpiredGraceDays}

				location={data.location}

				canWrite={data.canWrite}
				canConsume={data.canConsume}

				{hasInventory}
				{initialShowAutoExpired}
				initialExpiryFilter={initialExpiryFilter}

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

	.inventory-sticky-tabs {
		position: sticky;
		top: var(--sticky-below-header);
		z-index: var(--z-sticky-chrome);
		padding-bottom: var(--space-xs);
		background: var(--color-bg);
	}



	.add-goods-block {

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

	}



	.add-primary {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		gap: var(--space-sm);

		min-height: 2.75rem;

		padding: 0.75rem 1rem;

		font-weight: 700;

		font-size: 1rem;

		border-radius: var(--radius-md);

		text-decoration: none;

		background: var(--color-primary);

		color: var(--color-on-primary);

		box-shadow: var(--shadow-sm);

	}



	.add-primary:hover {

		background: var(--color-primary-hover);

		text-decoration: none;

	}

	.barcode-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		align-self: flex-start;
		min-height: var(--touch-target-min);
		min-width: var(--touch-target-min);
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}

	.barcode-action:hover {
		color: var(--color-primary-hover);
	}

	.other-ways {

		align-self: flex-start;

	}



	.other-ways summary {

		cursor: pointer;

		min-height: 2.75rem;

		padding: 0.35rem 0.15rem;

		font-weight: 600;

		font-size: 0.875rem;

		color: var(--color-text-muted);

		list-style: none;

	}



	.other-ways summary::-webkit-details-marker {

		display: none;

	}



	.other-ways summary:hover {

		color: var(--color-primary);

	}



	.other-ways-nav {

		display: flex;

		flex-direction: column;

		gap: 0.35rem;

		padding: 0.25rem 0 0.5rem;

	}



	.other-ways-nav a {

		min-height: 2.75rem;

		padding: 0.35rem 0.15rem;

		font-weight: 600;

		font-size: 0.875rem;

		color: var(--color-primary);

		text-decoration: underline;

		text-underline-offset: 0.15em;

	}



	.other-ways-nav a:hover {

		color: var(--color-primary-hover);

		text-decoration: none;

	}



	@media (min-width: 560px) {

		.add-goods-block {

			max-width: 28rem;

		}

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

