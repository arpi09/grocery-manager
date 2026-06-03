<script lang="ts">
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import ItemRow from '$lib/components/molecules/ItemRow.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import type { FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import {
		fetchInventoryActivePage,
		fetchInventoryAutoExpired,
		fetchInventoryFinished
	} from '$lib/client/inventory-data';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import type { StorageLocation } from '$lib/domain/location';
	import { scanModeHref } from '$lib/utils/scan-nav';

	interface Props {
		items: InventoryItem[];
		activeTotal: number;
		autoExpiredTotal: number;
		finishedTotal: number;
		autoExpiredGraceDays: number;
		location: StorageLocation;
		canWrite?: boolean;
		hasInventory?: boolean;
	}

	let {
		items,
		activeTotal,
		autoExpiredTotal,
		finishedTotal,
		autoExpiredGraceDays,
		location,
		canWrite = false,
		hasInventory = true
	}: Props = $props();

	const inventoryPath = $derived(`/inventory/${location}`);
	const scanHref = $derived(scanModeHref('photo', inventoryPath, { location }));
	const manualAddHref = $derived(
		`/item/new?location=${location}&from=${encodeURIComponent(inventoryPath)}`
	);

	let query = $state('');
	let showAutoExpired = $state(false);
	let showFinished = $state(false);
	let loadedItems = $state<InventoryItem[]>([]);
	let autoExpiredItems = $state<InventoryItem[]>([]);
	let finishedItems = $state<InventoryItem[]>([]);
	let loadingMore = $state(false);
	let loadingAutoExpired = $state(false);
	let loadingFinished = $state(false);
	let autoExpiredLoaded = $state(false);
	let finishedLoaded = $state(false);
	let reduceMotion = $state(true);

	$effect(() => {
		if (!browser) {
			return;
		}
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	$effect.pre(() => {
		loadedItems = items;
		autoExpiredItems = [];
		finishedItems = [];
		autoExpiredLoaded = false;
		finishedLoaded = false;
		showAutoExpired = false;
		showFinished = false;
	});

	const filtered = $derived(
		loadedItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
	);
	const filteredAutoExpired = $derived(
		showAutoExpired
			? autoExpiredItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
			: []
	);
	const filteredFinished = $derived(
		showFinished
			? finishedItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
			: []
	);
	const hasMoreActive = $derived(loadedItems.length < activeTotal);
	const hasVisibleItems = $derived(
		filtered.length > 0 || filteredAutoExpired.length > 0 || filteredFinished.length > 0
	);
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

	async function toggleAutoExpired() {
		const next = !showAutoExpired;
		showAutoExpired = next;
		if (!next || autoExpiredLoaded || autoExpiredTotal === 0 || !browser) return;
		loadingAutoExpired = true;
		try {
			autoExpiredItems = (await fetchInventoryAutoExpired(location)).items;
			autoExpiredLoaded = true;
		} finally {
			loadingAutoExpired = false;
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
			{#if autoExpiredTotal > 0 || finishedTotal > 0}
				<div class="filter-meta">
					{#if autoExpiredTotal > 0}
						<button
							type="button"
							class="section-chip"
							aria-pressed={showAutoExpired}
							disabled={loadingAutoExpired}
							onclick={toggleAutoExpired}
						>
							{loadingAutoExpired
								? t('common.loading')
								: showAutoExpired
									? t('inventory.hideAutoExpired')
									: t('inventory.showAutoExpired')}
							<span class="section-count">{autoExpiredTotal}</span>
						</button>
					{/if}
					{#if finishedTotal > 0}
						<button
							type="button"
							class="section-chip"
							aria-pressed={showFinished}
							disabled={loadingFinished}
							onclick={toggleFinished}
						>
							{loadingFinished
								? t('common.loading')
								: showFinished
									? t('inventory.hideFinished')
									: t('inventory.showFinished')}
							<span class="section-count">{finishedTotal}</span>
						</button>
					{/if}
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
					? t('photoRound.title')
					: t('inventory.backHome')}
			actionHref={isSearchEmpty ? undefined : canWrite ? scanHref : '/'}
			secondaryActionLabel={!isSearchEmpty && canWrite && !hasInventory
				? t('inventory.addManual')
				: undefined}
			secondaryActionHref={!isSearchEmpty && canWrite && !hasInventory ? manualAddHref : undefined}
		/>
	{:else}
		<ul class="item-list" aria-label={t('inventory.listAria')}>
			{#each filtered as item, index (item.id)}
				{#if reduceMotion}
					<li><ItemRow {item} {canWrite} finished={false} autoExpired={false} /></li>
				{:else}
					<li
						in:fly={{ y: 8, duration: 220, delay: Math.min(index, 8) * 35 }}
					>
						<ItemRow {item} {canWrite} finished={false} autoExpired={false} />
					</li>
				{/if}
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

		{#if filteredAutoExpired.length > 0}
			<div class="secondary-section-head">
				<div>
					<h2 class="secondary-heading">{t('inventory.autoExpiredSection')}</h2>
					<p class="secondary-note">
						{t('inventory.autoExpiredNote', { days: autoExpiredGraceDays })}
					</p>
				</div>
				{#if canWrite}
					<DeleteConfirmButton
						tier={3}
						context="inventoryAutoExpiredBulk"
						copyOptions={{ count: filteredAutoExpired.length }}
						action="?/bulkDiscardAutoExpired"
						variant="ghost"
						label={t('inventory.clearAutoExpired')}
						class="clear-auto-expired-action"
						ariaLabel={t('inventory.clearAutoExpiredAria', {
							count: filteredAutoExpired.length
						})}
					/>
				{/if}
			</div>
			<ul class="item-list auto-expired-list" aria-label={t('inventory.autoExpiredSection')}>
				{#each filteredAutoExpired as item (item.id)}
					<li><ItemRow {item} {canWrite} finished={false} autoExpired={true} /></li>
				{/each}
			</ul>
		{/if}

		{#if filteredFinished.length > 0}
			<h2 class="secondary-heading">{t('inventory.finishedSection')}</h2>
			<ul class="item-list finished-list" aria-label={t('inventory.finishedSection')}>
				{#each filteredFinished as item (item.id)}
					<li><ItemRow {item} {canWrite} finished={true} autoExpired={false} /></li>
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
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
	}

	.section-chip {
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

	.section-chip:hover:not(:disabled) {
		color: var(--color-primary);
		text-decoration-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
	}

	.section-chip:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.section-chip[aria-pressed='true'] {
		color: var(--color-primary);
		text-decoration: none;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		padding: 0.2rem 0.5rem;
	}

	.section-count {
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

	.section-chip[aria-pressed='true'] .section-count {
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
		color: var(--color-primary);
	}

	.load-more-row {
		display: flex;
		justify-content: center;
	}

	.secondary-section-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
		padding-top: var(--space-sm);
	}

	.secondary-heading {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.secondary-note {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.finished-list :global(.row),
	.auto-expired-list :global(.row) {
		opacity: 0.78;
	}

	:global(.clear-auto-expired-action) {
		flex-shrink: 0;
	}
</style>
