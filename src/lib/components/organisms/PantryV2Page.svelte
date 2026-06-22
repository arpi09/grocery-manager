<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import PantryShelfActions from '$lib/components/molecules/PantryShelfActions.svelte';
	import MissingExpiryFilterChip from '$lib/components/molecules/MissingExpiryFilterChip.svelte';
	import PantryV2EmptyState from '$lib/components/organisms/PantryV2EmptyState.svelte';
	import PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';
	import { trackPantryShelfOpened } from '$lib/client/pantry-v2-telemetry';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { buildPantryShelfView, countMissingExpiry, filterInventoryBySearch } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	interface Props {
		items: InventoryItem[];
		canWrite?: boolean;
		loadFailed?: boolean;
	}

	let { items, canWrite = false, loadFailed = false }: Props = $props();

	let searchQuery = $state('');

	const filteredItems = $derived(filterInventoryBySearch(items, searchQuery));
	const shelf = $derived(buildPantryShelfView(filteredItems));
	const unfilteredShelf = $derived(buildPantryShelfView(items));
	const showSearchEmpty = $derived(
		searchQuery.trim().length > 0 && shelf.isEmpty && items.length > 0
	);
	const showHouseholdEmpty = $derived(
		!loadFailed && !showSearchEmpty && unfilteredShelf.isEmpty && searchQuery.trim().length === 0
	);
	const missingExpiryCount = $derived(countMissingExpiry(items));
	const missingExpiryHref = '/inventory/all?filter=noExpiry';

	$effect(() => {
		if (!browser) {
			return;
		}

		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				void invalidateAll();
			}
		};

		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	});

	$effect(() => {
		if (!browser || loadFailed) {
			return;
		}

		trackPantryShelfOpened(unfilteredShelf.totalActiveCount, unfilteredShelf.useSoon.length);
	});
</script>

<div class="pantry-v2-page" data-testid="pantry-v2-page">
	<PantryShelfActions bind:query={searchQuery} {canWrite} returnTo="/inventory" />

	{#if !loadFailed && !showHouseholdEmpty && missingExpiryCount > 0}
		<MissingExpiryFilterChip count={missingExpiryCount} href={missingExpiryHref} />
	{/if}

	{#if loadFailed}
		<button
			type="button"
			class="load-error"
			role="alert"
			data-testid="pantry-v2-load-error"
			onclick={() => void invalidateAll()}
		>
			{t('pantry.v2.error.loadFailed')}
		</button>
	{:else if showSearchEmpty}
		<p class="search-empty" role="status" data-testid="pantry-v2-search-empty">
			{t('inventory.noResults')}
		</p>
	{:else if showHouseholdEmpty}
		<PantryV2EmptyState {canWrite} />
	{:else}
		<PantryV2ShelfView {shelf} />
	{/if}
</div>

<style>
	.pantry-v2-page {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: var(--space-sm);
	}

	.search-empty {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.load-error {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		width: 100%;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-danger, #c0392b) 8%, var(--color-surface));
		color: var(--color-text);
		font: inherit;
		font-size: 0.875rem;
		text-align: center;
		cursor: pointer;
	}

	.load-error:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
