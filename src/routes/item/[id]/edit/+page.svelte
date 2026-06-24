<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';
	import PurchaseMemoryCard from '$lib/components/molecules/PurchaseMemoryCard.svelte';

	let { data, form } = $props();

	const backFallback = $derived(
		page.data.pantryUxV2Enabled ? '/inventory' : `/inventory/${data.item.location}`
	);
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('item.editTitle')}
		{backFallback}
		backLabel={t('dataGrid.backToPantry')}
	/>
	<PageContainer>
		{#if data.purchaseMemorySummary}
			<section class="purchase-memory-section" aria-label={t('priceMemory.card.title')}>
				<PurchaseMemoryCard
					summary={data.purchaseMemorySummary}
					entryPoint="product_detail"
				/>
			</section>
		{/if}
		<AddItemForm item={data.item} errors={form?.errors} consumeErrors={form?.consumeErrors} />
	</PageContainer>
</AppLayout>

<style>
	.purchase-memory-section {
		margin-bottom: var(--space-lg);
	}
</style>
