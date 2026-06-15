<script lang="ts">

	import { page } from '$app/state';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import AppHeader from '$lib/components/organisms/AppHeader.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import InventoryList from '$lib/components/organisms/InventoryList.svelte';

	import { getLocale, t } from '$lib/i18n';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import { scanHubHref } from '$lib/utils/scan-nav';
	import { parseInventoryExpiryFilter } from '$lib/utils/inventory-list-filters';



	let { data } = $props();



	const inventoryPath = $derived(`/inventory/${data.location}`);

	const addItemHref = $derived(

		`/item/new?location=${data.location}&from=${encodeURIComponent(inventoryPath)}`

	);

	const scanHubLinkHref = $derived(scanHubHref(inventoryPath));



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
			{#if data.canWrite}

				<div class="add-goods-block" data-testid="inventory-add-goods">

					<a class="add-primary" href={scanHubLinkHref}>

						{t('inventory.addGoods')}

					</a>

					<a class="add-manual" href={addItemHref} data-sveltekit-reload>{t('inventory.addManual')}</a>

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



	.add-goods-block {

		display: flex;

		flex-wrap: wrap;

		align-items: center;

		gap: var(--space-sm);

	}

	.add-manual {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: var(--space-xs) var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.add-manual:hover {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}



	.add-primary {

		display: inline-flex;

		align-items: center;

		justify-content: center;

		gap: var(--space-sm);

		min-height: var(--touch-target-min);

		padding: var(--space-sm) var(--space-lg);

		font-weight: 700;

		font-size: 0.9375rem;

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

