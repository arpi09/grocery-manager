<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/atoms/Button.svelte';
	import ItemRow from '$lib/components/molecules/ItemRow.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import type { FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import {
		fetchInventoryActivePage,
		fetchInventoryFinished
	} from '$lib/client/inventory-data';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		items: InventoryItem[];
		activeTotal: number;
		finishedTotal: number;
		location: StorageLocation;
		canWrite?: boolean;
		hasInventory?: boolean;
	}

	let {
		items,
		activeTotal,
		finishedTotal,
		location,
		canWrite = false,
		hasInventory = true
	}: Props = $props();

	const inventoryPath = $derived(`/inventory/${location}`);
	const scanHref = $derived(
		`/scan?mode=barcode&location=${location}&from=${encodeURIComponent(inventoryPath)}`
	);
	const manualAddHref = $derived(
		`/item/new?location=${location}&from=${encodeURIComponent(inventoryPath)}`
	);

	let query = $state('');
	let showFinished = $state(false);
	let loadedItems = $state<InventoryItem[]>([]);
	let finishedItems = $state<InventoryItem[]>([]);
	let loadingMore = $state(false);
	let loadingFinished = $state(false);
	let finishedLoaded = $state(false);

	$effect.pre(() => {
		loadedItems = items;
		finishedItems = [];
		finishedLoaded = false;
		showFinished = false;
	});

	const filtered = $derived(
		loadedItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
	);
	const filteredFinished = $derived(
		showFinished
			? finishedItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
			: []
	);
	const hasMoreActive = $derived(loadedItems.length < activeTotal);
	const hasVisibleItems = $derived(filtered.length > 0 || filteredFinished.length > 0);
	const isSearchEmpty = $derived(query.length > 0 && !hasVisibleItems);

	const locationName = $derived(locationLabel(getLocale(), location).toLowerCase());
	const emptyTitle = $derived(
		isSearchEmpty
			? t('inventory.noResults')
			: t('inventory.emptyTitle', { location: locationName })
	);
	const emptyDescription = $derived(
		isSearchEmpty
			? t('inventory.tryOtherSearch')
			: canWrite
				? t('inventory.emptyCanWriteShort', { location: locationName })
				: t('inventory.emptyReadonly', { location: locationName })
	);

	const locationIcons: Record<StorageLocation, FeatureIconId> = {
		fridge: 'fridge',
		freezer: 'freezer',
		cupboard: 'cupboard'
	};

	async function loadMoreActive() {
		if (!browser || loadingMore || !hasMoreActive) {
			return;
		}

		loadingMore = true;
		try {
			const page = await fetchInventoryActivePage(location, loadedItems.length);
			loadedItems = [...loadedItems, ...page.items];
		} finally {
			loadingMore = false;
		}
	}

	async function toggleFinished() {
		const next = !showFinished;
		showFinished = next;

		if (!next || finishedLoaded || finishedTotal === 0 || !browser) {
			return;
		}

		loadingFinished = true;
		try {
			const page = await fetchInventoryFinished(location);
			finishedItems = page.items;
			finishedLoaded = true;
		} finally {
			loadingFinished = false;
		}
	}
</script>

<div class="list">
	{#if hasInventory}
		<div class="filter-row">
			<SearchInput bind:value={query} placeholder={t('inventory.searchPlaceholder')} />
			{#if finishedTotal > 0}
				<div class="filter-meta">
					<button
						type="button"
						class="finished-chip"
						aria-pressed={showFinished}
						disabled={loadingFinished}
						onclick={toggleFinished}
					>
						{loadingFinished
							? t('common.loading')
							: showFinished
								? t('inventory.hideFinished')
								: t('inventory.showFinished')}
						<span class="finished-count">{finishedTotal}</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if !hasVisibleItems}
		<EmptyState
			iconId={isSearchEmpty ? undefined : locationIcons[location]}
			title={emptyTitle}
			description={emptyDescription}
			actionLabel={isSearchEmpty
				? undefined
				: canWrite
					? t('inventory.scanFirstItem')
					: t('inventory.backHome')}
			actionHref={isSearchEmpty ? undefined : canWrite ? scanHref : '/'}
			secondaryActionLabel={!isSearchEmpty && canWrite && !hasInventory
				? t('inventory.addManual')
				: undefined}
			secondaryActionHref={!isSearchEmpty && canWrite && !hasInventory ? manualAddHref : undefined}
		/>
	{:else}
		<ul class="item-list" aria-label={t('inventory.listAria')}>
			{#each filtered as item (item.id)}
				<li><ItemRow {item} {canWrite} finished={false} /></li>
			{/each}
		</ul>

		{#if hasMoreActive && query.length === 0}
			<div class="load-more-row">
				<Button
					type="button"
					variant="secondary"
					loading={loadingMore}
					loadingLabel={t('common.loading')}
					onclick={loadMoreActive}
				>
					{t('common.loadMore')}
				</Button>
			</div>
		{/if}

		{#if filteredFinished.length > 0}
			<h2 class="finished-heading">{t('inventory.finishedSection')}</h2>
			<ul class="item-list finished-list" aria-label={t('inventory.finishedSection')}>
				{#each filteredFinished as item (item.id)}
					<li><ItemRow {item} {canWrite} finished={true} /></li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.filter-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.filter-meta {
		display: flex;
		align-items: center;
	}

	.finished-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		padding: 0.15rem 0.35rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		text-decoration-color: color-mix(in srgb, var(--color-text-muted) 45%, transparent);
	}

	.finished-chip:hover:not(:disabled) {
		color: var(--color-primary);
		text-decoration-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
	}

	.finished-chip:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.finished-chip[aria-pressed='true'] {
		color: var(--color-primary);
		text-decoration: none;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.2rem 0.5rem;
	}

	.finished-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		padding: 0 0.3rem;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.finished-chip[aria-pressed='true'] .finished-count {
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-primary);
	}

	.load-more-row {
		display: flex;
		justify-content: center;
	}

	.finished-heading {
		margin: var(--space-xs) 0 0;
		padding-top: var(--space-sm);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.finished-list :global(.row) {
		opacity: 0.78;
	}
</style>
