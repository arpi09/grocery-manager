<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PantryShelfActions from '$lib/components/molecules/PantryShelfActions.svelte';
	import PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';
	import { buildPantryShelfView, filterInventoryBySearch } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	let { data } = $props();

	let searchQuery = $state('');

	const filteredItems = $derived(filterInventoryBySearch(data.items, searchQuery));
	const shelf = $derived(buildPantryShelfView(filteredItems));
	const showSearchEmpty = $derived(
		searchQuery.trim().length > 0 && shelf.isEmpty && data.items.length > 0
	);
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('pantry.v2.title')} />

	<PageContainer>
		<PantryShelfActions bind:query={searchQuery} canWrite={data.canWrite} returnTo="/inventory" />

		{#if showSearchEmpty}
			<p class="search-empty" role="status" data-testid="pantry-v2-search-empty">
				{t('inventory.noResults')}
			</p>
		{:else}
			<PantryV2ShelfView {shelf} />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.search-empty {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}
</style>
